import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: '' });
  const [filterRole, setFilterRole] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching users:', error.message);
    else {
      setUsers(data);
      setFilteredUsers(data);
      // Fetch all profiles for these users
      const userIds = data.map(u => u.id);
      const { data: profilesData } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
      // Map profiles by user id
      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
      }
      setProfiles(profilesMap);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();

    const res = await fetch('https://tywemactebkksgdsleha.supabase.co/functions/v1/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });

    const result = await res.json();
    if (result.success) {
      alert('User created successfully');
      setNewUser({ email: '', password: '', role: '' });
      setShowModal(false);
      fetchUsers();
    } else {
      alert('Error creating user: ' + result.error);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    const res = await fetch('https://tywemactebkksgdsleha.supabase.co/functions/v1/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();
    if (result.success) {
      alert('User deleted');
      fetchUsers();
    } else {
      alert('Error deleting user: ' + result.error);
    }
  };

  const handleRoleFilter = (role) => {
    setFilterRole(role);
    setCurrentPage(1);
    if (role === '') setFilteredUsers(users);
    else setFilteredUsers(users.filter((user) => user.role === role));
  };

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="p-8 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Users List</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          + Add User
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <select value={filterRole} onChange={(e) => handleRoleFilter(e.target.value)} className="border px-3 py-2 rounded text-sm">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="recruitpro">RecruitPro</option>
          <option value="jobseeker">Job Seeker</option>
          <option value="client">Client</option>
        </select>

        <select value={perPage} onChange={(e) => setPerPage(parseInt(e.target.value))} className="border px-3 py-2 rounded text-sm">
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-sm text-gray-700">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
          {paginatedUsers.map((user) => (
            <tr key={user.id}>
              <td className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 text-gray-600 flex items-center justify-center rounded-full text-xs font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span>
                  {profiles[user.id]?.first_name && profiles[user.id]?.last_name
                    ? `${profiles[user.id].first_name} ${profiles[user.id].last_name}`
                    : user.email.split('@')[0]}
                </span>
              </td>
              <td className="p-3">{user.email}</td>
              <td className="p-3 capitalize">{user.role}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  Active
                </span>
              </td>
              <td className="p-3">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs hover:bg-red-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className="flex justify-end items-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="text-sm text-blue-600 px-3 py-1 border rounded"
        >
          Previous
        </button>
        <span className="text-sm">Page {currentPage}</span>
        <button
          onClick={() => setCurrentPage((prev) => (prev * perPage < filteredUsers.length ? prev + 1 : prev))}
          className="text-sm text-blue-600 px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full border p-2 rounded"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border p-2 rounded"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="recruitpro">RecruitPro</option>
                <option value="jobseeker">Job Seeker</option>
                <option value="client">Client</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
