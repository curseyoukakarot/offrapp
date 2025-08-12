import { useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const FormBuilder = () => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionType, setQuestionType] = useState('text');
  const [label, setLabel] = useState('');
  const [options, setOptions] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]); // NEW
  const navigate = useNavigate();

  const addQuestion = () => {
    if (!label) return alert('Label is required');

    const newQuestion = {
      type: questionType,
      label,
      ...(questionType === 'dropdown' ? { options: options.split(',').map((o) => o.trim()) } : {}),
    };

    setQuestions([...questions, newQuestion]);
    setLabel('');
    setOptions('');
  };

  const handleSaveForm = async () => {
    if (!title || questions.length === 0 || assignedRoles.length === 0) {
      alert('Form needs a title, at least one question, and assigned roles.');
      return;
    }

    const { data, error } = await supabase.from('forms').insert([
      {
        title,
        schema: questions,
        assigned_roles: assignedRoles, // assuming assigned_roles is array type in Supabase
      },
    ]);

    if (error) {
      alert('Error saving form: ' + error.message);
    } else {
      alert('Form saved! Notifying users...');

      // Notify users in assigned roles
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('email, role')
        .in('role', assignedRoles);

      if (userError) {
        console.error('Error fetching users for notification:', userError);
      } else {
        console.log('Users to notify:', users);
        // TODO: Integrate Slack webhook or email system here
        // Example: send notification to backend API that hits Slack
      }

      navigate('/forms');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8 ml-64">
        <h1 className="text-2xl font-bold mb-6">Create a New Form</h1>

        <div className="bg-white p-6 rounded shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Form Title</label>
            <input
              type="text"
              className="border w-full px-4 py-2 rounded"
              placeholder="Enter form title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* NEW ROLE SELECTOR */}
          <div>
            <label className="block text-sm font-medium mb-1">Assign to Roles</label>
            <select
              multiple
              value={assignedRoles}
              onChange={(e) =>
                setAssignedRoles(Array.from(e.target.selectedOptions, (option) => option.value))
              }
              className="border px-3 py-2 rounded w-full"
            >
              <option value="admin">Admin</option>
              <option value="jobseeker">Jobseeker</option>
              <option value="client">Client</option>
              <option value="recruitpro">RecruitPro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="text">Short Answer</option>
                <option value="longtext">Long Answer</option>
                <option value="dropdown">Dropdown</option>
                <option value="file">File Upload</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                type="text"
                className="border px-3 py-2 rounded w-full"
                placeholder="e.g. What is your goal?"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {questionType === 'dropdown' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Dropdown Options (comma separated)</label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Option 1, Option 2, Option 3"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                />
              </div>
            )}

            <div className="col-span-2">
              <button
                onClick={addQuestion}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Add Question
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mt-6 mb-2">Preview</h2>
            <ul className="space-y-2">
              {questions.map((q, i) => (
                <li key={i} className="p-3 bg-gray-100 rounded text-sm">
                  <strong>{q.label}</strong> ({q.type})
                  {q.type === 'dropdown' && (
                    <span className="ml-2 text-gray-600">→ Options: {q.options.join(', ')}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              onClick={handleSaveForm}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Save Form
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormBuilder;
