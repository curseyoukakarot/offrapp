import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';

const notifyZapier = async (formTitle, answers) => {
  // POST to your backend endpoint instead of Zapier directly
  const backendUrl = 'https://offr.app/api/notify-zapier';

  // Map your form fields to the payload Zapier expects
  const payload = {
    // Include the first two questions from the form
    fullName: answers["What is your full name?"] || '',
    email: answers["What is your email address?"] || '',
    // Existing fields
    name: `${answers["What is your Job Seeker's First Name?"] || ''} ${answers["What is your Job Seeker's Last Name?"] || ''}`.trim(),
    jobSeekerEmail: answers["What is the Job Seeker's email address?"] || '',
    phone: answers["What is the Job Seeker's Phone Number?"] || '',
    downPayment: answers["Let's get the terms of the engagement. What is the down payment amount?"] || '',
    placementFee: answers["What is the Placement Fee agreed upon?"] || '',
  };

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to send data: ${response.statusText}`);
    }
    console.log('✅ Backend notified, Zapier webhook triggered');
  } catch (error) {
    console.error('❌ Error sending data to backend/Zapier:', error);
  }
};

const notifySlack = async (formTitle, answers) => {
  // POST to your backend endpoint for Slack notification
  const backendUrl = 'https://offr.app/api/notify-slack';

  const payload = {
    firstName: answers["What is your first name?"] || '',
    lastName: answers["What is your last name?"] || '',
    linkedin: answers["Please add a link to your LinkedIn profile"] || '',
    industries: answers["What industries do you see yourself working in? List all that apply"] || '',
    targetCompanies: answers["Please list a few company examples you would like to work for"] || '',
    hiringManagerTitle: answers["Do you know the title of the hiring manager that you want to work for?"] || '',
    // Format the Slack message
    slackMessage: `Hey hey hey! This jobseeker has finished filling out their intake form!\n\nName:\n${answers["What is your first name?"] || ''} ${answers["What is your last name?"] || ''}\n\nLinkedin:\n${answers["Please add a link to your LinkedIn profile"] || ''}\n\nICP:\n${answers["What industries do you see yourself working in? List all that apply"] || ''}\n${answers["Please list a few company examples you would like to work for"] || ''}\n\nHiring Manager Title:\n${answers["Do you know the title of the hiring manager that you want to work for?"] || ''}`
  };

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to send data: ${response.statusText}`);
    }
    console.log('✅ Backend notified, Slack webhook triggered');
  } catch (error) {
    console.error('❌ Error sending data to backend/Slack:', error);
  }
};

const FormRenderer = () => {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [formFields, setFormFields] = useState([]);
  const [formTitle, setFormTitle] = useState('');
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    // Get role from JWT
    const jwtRole = 
      user.app_metadata?.role ??
      user.user_metadata?.role ??
      'authenticated';
    
    console.log('User role from JWT:', jwtRole);
    setRole(jwtRole);
  }, [user]);

  useEffect(() => {
    if (!user?.id || !role) return;
    const fetchForm = async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('title, fields, schema, assigned_roles')
        .eq('id', id)
        .single();

      console.log('Fetched form data:', data);

      if (error) {
        console.error('Error fetching form:', error.message);
        navigate('/forms');
      } else {
        if (role === 'admin' || (Array.isArray(data.assigned_roles) && data.assigned_roles.includes(role))) {
          setHasAccess(true);
          setFormTitle(data.title);
          setFormFields(data.fields || data.schema || []);
        } else {
          setHasAccess(false);
        }
      }
      setLoading(false);
    };
    fetchForm();
  }, [id, user?.id, role, navigate]);

  const handleChange = (e, fieldName, fieldType) => {
    const value = fieldType === 'file_upload' ? e.target.files[0] : e.target.value;
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const uploadFile = async (file) => {
    const filePath = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('user-files').upload(filePath, file);
    if (error) {
      console.error('Upload failed:', error.message);
      return null;
    }
    const { data: publicData, error: urlError } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);
    if (urlError) {
      console.error('Failed to get public URL:', urlError.message);
      return null;
    }
    return publicData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let processedAnswers = { ...formValues };
    for (const field of formFields) {
      if (field.type === 'file_upload') {
        const file = formValues[field.label];
        if (file instanceof File) {
          const uploadedUrl = await uploadFile(file);
          processedAnswers[field.label] = uploadedUrl || 'Upload failed';
        }
      }
    }
    const { error } = await supabase.from('form_responses').insert([
      { form_id: id, user_id: user.id, answers: processedAnswers },
    ]);
    if (error) {
      console.error('Error submitting form:', error.message);
      return;
    }
    // Notify Zapier if this is the Job Seeker Intake Form
    await notifyZapier(formTitle, processedAnswers);
    // Notify Slack if this is the Career Nav Intake Form
    if (formTitle === "Career Nav Intake Form") {
      await notifySlack(formTitle, processedAnswers);
    }
    alert('Form submitted successfully!');
  };

  if (loading) return <div className="p-6">Loading form...</div>;
  if (!hasAccess)
    return <div className="p-6 text-red-500">🚫 You do not have access to this form.</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <main className="flex-1 bg-gray-50 p-8 ml-64">
        <h1 className="text-2xl font-bold mb-6">{formTitle}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formFields.map((field, index) => (
            <div key={index}>
              <label className="block text-gray-700 font-semibold mb-2">{field.label}</label>
              {(field.type === 'short_answer' || field.type === 'text') && (
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  onChange={(e) => handleChange(e, field.label, field.type)}
                />
              )}
              {(field.type === 'long_answer' || field.type === 'longtext') && (
                <textarea
                  rows="4"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  onChange={(e) => handleChange(e, field.label, field.type)}
                />
              )}
              {(field.type === 'dropdown') && (
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  onChange={(e) => handleChange(e, field.label, field.type)}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {(field.type === 'file_upload' || field.type === 'file') && (
                <input
                  type="file"
                  className="w-full"
                  onChange={(e) => handleChange(e, field.label, field.type)}
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700"
          >
            Submit
          </button>
        </form>
      </main>
    </div>
  );
};

export default FormRenderer;
