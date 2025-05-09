import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FormAssignRoles from './FormAssignRoles'; // make sure this is imported!
import { useUser } from '../lib/useUser';

const FormsList = () => {
  const { user } = useUser();
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredForms, setFilteredForms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [formsPerPage] = useState(5);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formToEdit, setFormToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRoles, setEditRoles] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    // Get role from JWT
    const jwtRole = 
      user.app_metadata?.role ??
      user.user_metadata?.role ??
      'authenticated';
    
    console.log('User role from JWT:', jwtRole);
    setRole(jwtRole);
    fetchForms(); // Move fetchForms here so it runs after we have the role
  }, [user]);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase.from('forms').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching forms:', error.message);
      } else {
        setForms(data || []);
      }
    } catch (error) {
      console.error('Error in fetchForms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter forms by search and assigned_roles
    let filtered = forms.filter(form =>
      form.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (role && role !== 'admin') {
      filtered = filtered.filter(form => Array.isArray(form.assigned_roles) && form.assigned_roles.includes(role));
    }
    setFilteredForms(filtered);
    setCurrentPage(1);
  }, [searchTerm, forms, role]);

  const indexOfLastForm = currentPage * formsPerPage;
  const indexOfFirstForm = indexOfLastForm - formsPerPage;
  const currentForms = filteredForms.slice(indexOfFirstForm, indexOfLastForm);
  const totalPages = Math.ceil(filteredForms.length / formsPerPage);

  const handleNewForm = () => navigate('/forms/new');
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Edit form handlers
  const openEditModal = (form) => {
    setFormToEdit(form);
    setEditTitle(form.title);
    setEditRoles(form.assigned_roles || []);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setFormToEdit(null);
    setEditTitle('');
    setEditRoles([]);
  };
  const handleEditForm = async (e) => {
    e.preventDefault();
    if (!formToEdit) return;
    const { error } = await supabase
      .from('forms')
      .update({ title: editTitle, assigned_roles: editRoles })
      .eq('id', formToEdit.id);
    if (!error) {
      fetchForms();
      closeEditModal();
      setNotification({ type: 'success', message: 'Form updated successfully!' });
    } else {
      setNotification({ type: 'error', message: 'Failed to update form.' });
    }
    setTimeout(() => setNotification(null), 3000);
  };
  const handleDeleteForm = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form? This cannot be undone.')) return;
    const { error } = await supabase.from('forms').delete().eq('id', formId);
    if (!error) {
      fetchForms();
      setNotification({ type: 'success', message: 'Form deleted successfully!' });
    } else {
      setNotification({ type: 'error', message: 'Failed to delete form.' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <main className="flex-1 bg-gray-50 p-8 ml-64">
        {/* Notification Popup */}
        {notification && (
          <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {notification.message}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Forms</h1>
          {role === 'admin' && (
            <button
              onClick={handleNewForm}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Form
            </button>
          )}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by form title..."
            className="w-full px-4 py-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {currentForms.length === 0 ? (
          <div className="bg-white p-12 text-center rounded shadow text-gray-500">
            <p>No forms found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentForms.map((form) => (
              <div
                key={form.id}
                className={`bg-white p-6 rounded shadow border border-transparent transition relative ${role === 'admin' ? 'cursor-pointer hover:border-blue-500' : 'cursor-pointer hover:border-blue-500'}`}
                onClick={() => navigate(`/forms/${form.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{form.title}</h3>
                <p className="text-sm text-gray-500 mb-2">Created: {new Date(form.created_at).toLocaleDateString()}</p>
                {role === 'admin' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-3 py-1 text-xs rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      onClick={(e) => { e.stopPropagation(); openEditModal(form); }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200"
                      onClick={(e) => { e.stopPropagation(); handleDeleteForm(form.id); }}
                    >
                      Delete
                    </button>
                    <button
                      className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                      onClick={(e) => { e.stopPropagation(); navigate(`/forms/${form.id}/responses`); }}
                    >
                      Responses
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Form</h2>
              <form onSubmit={handleEditForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Form Title</label>
                  <input
                    type="text"
                    className="border w-full px-4 py-2 rounded"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assign to Roles</label>
                  <select
                    multiple
                    value={editRoles}
                    onChange={(e) =>
                      setEditRoles(Array.from(e.target.selectedOptions, (option) => option.value))
                    }
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="admin">Admin</option>
                    <option value="jobseeker">Jobseeker</option>
                    <option value="client">Client</option>
                    <option value="recruitpro">RecruitPro</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Assign Roles section - only visible to admin */}
        {role === 'admin' && (
          <div className="mt-12">
            <FormAssignRoles />
          </div>
        )}
      </main>
    </div>
  );
};

export default FormsList;
