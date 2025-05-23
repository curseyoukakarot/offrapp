import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';

const UsersList = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Fetch role from users table
    const fetchRole = async () => {
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      setRole(userRow?.role || 'authenticated');
      fetchUsers();
    };
    fetchRole();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching users:', error.message);
      } else {
        setUsers(usersData);
        setFilteredUsers(usersData);
        // Fetch all profiles for these users
        const userIds = usersData.map(u => u.id);
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
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
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

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditFeedback('');
    // Update email/role as before
    const { error } = await supabase
      .from('users')
      .update({ email: editEmail, role: editRole })
      .eq('id', editingUser.id);

    if (error) {
      setEditFeedback('Update failed: ' + error.message);
      return;
    }

    // If password is set, call the serverless function
    if (editPassword) {
      try {
        const res = await fetch('/api/admin-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: editingUser.id, new_password: editPassword }),
        });
        const result = await res.json();
        if (!res.ok) {
          setEditFeedback('Password update failed: ' + (result.error || 'Unknown error'));
          return;
        }
      } catch (err) {
        setEditFeedback('Password update failed: ' + err.message);
        return;
      }
    }

    setEditFeedback('User updated!');
    setTimeout(() => {
      setEditingUser(null);
      setEditPassword('');
      setEditFeedback('');
    }, 1200);
    fetchUsers();
  };

  const handleRoleFilter = (role) => {
    setFilterRole(role);
    setCurrentPage(1);
    if (role === '') setFilteredUsers(users);
    else setFilteredUsers(users.filter((user) => user.role === role));
  };

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />

      <main className="flex-1 bg-gray-50 p-8 ml-64">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">CRM – Users</h2>
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
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setEditEmail(user.email);
                        setEditRole(user.role);
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-200"
                    >
                      Edit
                    </button>
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
        </div>

        {editingUser && (
          <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-lg z-50 border-l">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Edit User</h3>
              {editFeedback && <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded mb-2">{editFeedback}</div>}
              <form onSubmit={handleUpdateUser} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="border w-full px-3 py-2 rounded mt-1"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Role</label>
                  <select
                    className="border w-full px-3 py-2 rounded mt-1"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="recruitpro">RecruitPro</option>
                    <option value="jobseeker">Job Seeker</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">New Password (optional)</label>
                  <input
                    type="password"
                    className="border w-full px-3 py-2 rounded mt-1"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Set a new password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => { setEditingUser(null); setEditPassword(''); setEditFeedback(''); }}
                    className="text-sm px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UsersList;
