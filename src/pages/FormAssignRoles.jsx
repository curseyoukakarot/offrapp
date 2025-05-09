import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const FormAssignRoles = () => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    const fetchForms = async () => {
      const { data, error } = await supabase.from('forms').select('id, title');
      if (error) console.error('Error fetching forms:', error.message);
      else setForms(data || []);
    };
    fetchForms();
  }, []);

  const handleCheckboxChange = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedForm) {
      alert('Please select a form');
      return;
    }

    const { error } = await supabase
      .from('forms')
      .update({ assigned_roles: selectedRoles })
      .eq('id', selectedForm);

    if (error) {
      console.error('Error saving assignments:', error.message);
      alert('Error saving assignments');
    } else {
      alert('Assignments saved successfully');
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow space-y-4 mt-10">
      <h2 className="text-xl font-semibold mb-4">Assign Forms to User Roles</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Form</label>
          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="">-- Select a form --</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Assign Roles</label>
          <div className="grid grid-cols-2 gap-2">
            {['admin', 'jobseeker', 'recruitpro', 'client'].map((role) => (
              <label key={role} className="flex items-center">
                <input
                  type="checkbox"
                  value={role}
                  checked={selectedRoles.includes(role)}
                  onChange={() => handleCheckboxChange(role)}
                  className="mr-2"
                />
                {role}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveAssignments}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Assignments
        </button>
      </div>
    </div>
  );
};

export default FormAssignRoles;

