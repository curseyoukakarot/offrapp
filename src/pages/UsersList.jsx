import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../lib/useUser';
import { useTenantConfig } from '../lib/tenantConfig';

const UsersList = () => {
  const { user } = useUser();
  const { roleLabel } = useTenantConfig();
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [search, setSearch] = useState('');
  const [filterRoles, setFilterRoles] = useState([]); // multi-select
  const [filterStatus, setFilterStatus] = useState(''); // Active|Suspended
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState({ key: 'created_at', dir: 'desc' });
  const [drawerUser, setDrawerUser] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching users:', error.message);
      } else {
        setUsers(usersData);
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
    // Double-confirm dialog with option to delete files
    const msg = 'Delete this user? You can choose to also delete their files.\n\nClick OK to continue and choose whether to remove files, or Cancel to abort.';
    if (!window.confirm(msg)) return;
    const alsoDeleteFiles = window.confirm('Also delete files owned by this user? This cannot be undone.');

    const res = await fetch('https://tywemactebkksgdsleha.supabase.co/functions/v1/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, deleteFiles: alsoDeleteFiles }),
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

  // Derived filtering, search, sorting
  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.email.toLowerCase().includes(q) || (profiles[u.id]?.first_name + ' ' + profiles[u.id]?.last_name || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q));
    }
    if (filterRoles.length) {
      list = list.filter((u) => filterRoles.includes(u.role));
    }
    if (filterStatus) {
      // Placeholder: if you later have status column, filter by it
      if (filterStatus === 'active') list = list; else list = [];
    }
    // Sort
    list.sort((a, b) => {
      const dir = sortBy.dir === 'asc' ? 1 : -1;
      const ka = sortBy.key === 'name' ? (profiles[a.id]?.first_name || '') : sortBy.key === 'role' ? (a.role || '') : sortBy.key === 'email' ? a.email : a.created_at;
      const kb = sortBy.key === 'name' ? (profiles[b.id]?.first_name || '') : sortBy.key === 'role' ? (b.role || '') : sortBy.key === 'email' ? b.email : b.created_at;
      if (ka < kb) return -1 * dir;
      if (ka > kb) return 1 * dir;
      return 0;
    });
    return list;
  }, [users, profiles, search, filterRoles, filterStatus, sortBy]);

  const total = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? paginatedUsers.map((u) => u.id) : []);
  };

  const bulkChangeRole = async (nextRole) => {
    await supabase.from('users').update({ role: nextRole }).in('id', selectedIds);
    setSelectedIds([]);
    fetchUsers();
  };
  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Role', 'Created'];
    const rows = filteredUsers.map((u) => [
      profiles[u.id]?.first_name && profiles[u.id]?.last_name ? `${profiles[u.id].first_name} ${profiles[u.id].last_name}` : u.email.split('@')[0],
      u.email,
      roleLabel((u.role || '').toLowerCase()),
      u.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'users.csv'; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 p-6">
      {/* Sticky Filters */}
      <div className="sticky top-0 z-10 bg-gray-50 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">CRM – Users</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-lg border" onClick={exportCsv}><i className="fa-solid fa-download mr-2"></i>Export CSV</button>
            <InviteUserButton />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, role" className="pl-9 pr-3 py-2 border rounded-lg w-72" />
          </div>
          <MultiRoleFilter value={filterRoles} onChange={setFilterRoles} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          {selectedIds.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
              <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => bulkChangeRole('client')}>Change role → {roleLabel('client')}</button>
              <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => bulkChangeRole('recruitpro')}>→ {roleLabel('recruitpro')}</button>
              <button className="px-3 py-1 bg-red-100 text-red-700 rounded" onClick={() => selectedIds.forEach((id) => handleDeleteUser(id))}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">Showing {paginatedUsers.length} of {total} users</div>
          <div className="flex items-center gap-2">
            <select value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value)); setCurrentPage(1); }} className="border px-3 py-2 rounded text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="p-3"><input type="checkbox" onChange={(e) => toggleSelectAll(e.target.checked)} /></th>
                {['name','email','role','last_active','created_at'].map((k) => (
                  <th key={k} className="p-3 text-left cursor-pointer" onClick={() => setSortBy(({ key, dir }) => ({ key: k, dir: key === k && dir === 'asc' ? 'desc' : 'asc' }))}>
                    {k === 'name' ? 'Name' : k === 'email' ? 'Email' : k === 'role' ? 'Role' : k === 'last_active' ? 'Last Active' : 'Date Added'}
                  </th>
                ))}
                <th className="p-3 text-left">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                  <td className="p-3">
                    <button className="flex items-center gap-3" onClick={() => setDrawerUser(u)}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleBg(u.role)}`}>{(profiles[u.id]?.first_name || u.email[0]).toUpperCase()}</div>
                      <span className="text-blue-600 hover:underline">
                        {profiles[u.id]?.first_name && profiles[u.id]?.last_name ? `${profiles[u.id].first_name} ${profiles[u.id].last_name}` : u.email.split('@')[0]}
                      </span>
                    </button>
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 capitalize"><span className={`px-2 py-1 rounded-full text-xs ${roleChip(u.role)}`}>{roleLabel((u.role || '').toLowerCase())}</span></td>
                  <td className="p-3 text-gray-500">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '—'}</td>
                  <td className="p-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:translate-x-0 after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full relative"></div>
                    </label>
                  </td>
                  <td className="p-3 text-right relative">
                    <button className="px-2 py-1 rounded hover:bg-gray-100" onClick={() => setMenuOpenId(menuOpenId === u.id ? null : u.id)}>
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    {menuOpenId === u.id && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow z-10">
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setEditingUser(u); setEditEmail(u.email); setEditRole(u.role); setMenuOpenId(null); }}>Edit</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setDrawerUser(u); setMenuOpenId(null); }}>View Activity</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={async () => { setMenuOpenId(null); await fetch('/api/admin-reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: u.id, new_password: 'Temp123!@#' }) }); alert('Password reset link sent'); }}>Reset Password</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { const next = prompt('Change role to (admin/recruitpro/jobseeker/client):', u.role || ''); if (next) supabase.from('users').update({ role: next }).eq('id', u.id).then(fetchUsers); setMenuOpenId(null); }}>Change Role</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-red-50 text-red-600" onClick={() => { setMenuOpenId(null); handleDeleteUser(u.id); }}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <button onClick={() => setCurrentPage((p) => (p * perPage < total ? p + 1 : p))} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerUser && (
        <div className="fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl z-40 border-l">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${roleBg(drawerUser.role)}`}>{(profiles[drawerUser.id]?.first_name || drawerUser.email[0]).toUpperCase()}</div>
              <div>
                <div className="font-semibold">{profiles[drawerUser.id]?.first_name && profiles[drawerUser.id]?.last_name ? `${profiles[drawerUser.id].first_name} ${profiles[drawerUser.id].last_name}` : drawerUser.email.split('@')[0]}</div>
                <div className="text-xs text-gray-500">{drawerUser.email}</div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setDrawerUser(null)}><i className="fa-solid fa-times"></i></button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div>
              <div className="text-sm text-gray-500 mb-1">Role</div>
              <div className={`inline-flex px-2 py-1 rounded-full text-xs ${roleChip(drawerUser.role)}`}>{roleLabel((drawerUser.role || '').toLowerCase())}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Activity (last 30 days)</div>
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Edit Drawer */}
      {editingUser && (
        <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-lg z-50 border-l">
          <div className="p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Edit User</h3>
            {editFeedback && <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded mb-2">{editFeedback}</div>}
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" className="border w-full px-3 py-2 rounded mt-1" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select className="border w-full px-3 py-2 rounded mt-1" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="recruitpro">RecruitPro</option>
                  <option value="jobseeker">Job Seeker</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">New Password (optional)</label>
                <input type="password" className="border w-full px-3 py-2 rounded mt-1" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Set a new password" autoComplete="new-password" />
              </div>
              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => { setEditingUser(null); setEditPassword(''); setEditFeedback(''); }} className="text-sm px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;

function roleBg(role) {
  switch ((role || '').toLowerCase()) {
    case 'admin': return 'bg-blue-100 text-blue-700';
    case 'recruitpro': return 'bg-green-100 text-green-700';
    case 'jobseeker': return 'bg-orange-100 text-orange-700';
    case 'client': return 'bg-gray-200 text-gray-700';
    default: return 'bg-gray-200 text-gray-700';
  }
}
function roleChip(role) {
  switch ((role || '').toLowerCase()) {
    case 'admin': return 'bg-blue-100 text-blue-700';
    case 'recruitpro': return 'bg-green-100 text-green-700';
    case 'jobseeker': return 'bg-orange-100 text-orange-700';
    case 'client': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function MultiRoleFilter({ value, onChange }) {
  const roles = ['admin', 'recruitpro', 'jobseeker', 'client'];
  const toggle = (r) => {
    const set = new Set(value);
    set.has(r) ? set.delete(r) : set.add(r);
    onChange(Array.from(set));
  };
  return (
    <div className="flex gap-2">
      {roles.map((r) => (
        <button key={r} type="button" onClick={() => toggle(r)} className={`px-3 py-2 rounded-lg text-sm border ${value.includes(r) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white'}`}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      ))}
    </div>
  );
}

function InviteUserButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('client');
  const submit = async () => {
    const res = await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    if (res.ok) { setOpen(false); setEmail(''); }
  };
  return (
    <>
      <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={() => setOpen(true)}><i className="fa-solid fa-user-plus mr-2"></i>Invite</button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)}></div>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Invite New User</h3>
            <input className="w-full border rounded px-3 py-2 mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className="w-full border rounded px-3 py-2 mb-4" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Client</option>
              <option value="recruitpro">RecruitPro</option>
              <option value="jobseeker">Job Seeker</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={submit}>Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
