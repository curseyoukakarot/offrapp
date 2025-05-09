import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';

const FilesPage = () => {
  const { user } = useUser();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [file, setFile] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user) return;
    
    // Get role from JWT
    const jwtRole = 
      user.app_metadata?.role ??
      user.user_metadata?.role ??
      'authenticated';
    
    console.log('User role from JWT:', jwtRole);
    setRole(jwtRole);
    fetchFiles();
    fetchUsers();
  }, [user]);

  const fetchFiles = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { data } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      setFiles(data || []);
    } catch (error) {
      console.error('Error in fetchFiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('users').select('id, email');
      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  };

  const handleAdminUpload = async (e) => {
    e.preventDefault();

    if (!file || !selectedUser) return alert('Please select user and file');

    const filePath = `${selectedUser}/${file.name}`;
    const { data: uploadData, error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file);

    if (error) return alert('Upload failed');

    const { data: { session } } = await supabase.auth.getSession();

    await supabase.from('files').insert([
      {
        user_id: selectedUser,
        file_url: `https://tywemactebkksgdsleha.supabase.co/storage/v1/object/public/user-files/${filePath}`,
        title: file.name,
        uploaded_by: session.user.id,
      },
    ]);

    setFile(null);
    setSelectedUser('');
    fetchFiles();
    alert('File uploaded for user');
  };

  const handleUserUpload = async (e) => {
    e.preventDefault();

    if (!file) return alert('Please select a file');

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session.user.id;
    const filePath = `${userId}/user-uploaded-${file.name}`;

    const { error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file);

    if (error) return alert('Upload failed');

    await supabase.from('files').insert([
      {
        user_id: userId,
        file_url: `https://tywemactebkksgdsleha.supabase.co/storage/v1/object/public/user-files/${filePath}`,
        title: file.name,
        uploaded_by: userId,
      },
    ]);

    setFile(null);
    fetchFiles();
    alert('File uploaded');
  };

  const viewerFiles = role === 'admin'
    ? files
    : files.filter((f) => f.user_id === user?.id);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />

      <main className="flex-1 bg-gray-50 p-8 ml-64">
        <h1 className="text-2xl font-bold mb-6">Files</h1>

        {role === 'admin' ? (
          <form onSubmit={handleAdminUpload} className="bg-white p-4 rounded shadow mb-6 space-y-3">
            <h2 className="font-semibold">Upload a file for a user</h2>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
          </form>
        ) : (
          <form onSubmit={handleUserUpload} className="bg-white p-4 rounded shadow mb-6 space-y-3">
            <h2 className="font-semibold">Upload a file</h2>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
          </form>
        )}

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">All Files</h2>

          {viewerFiles.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <i className="fa-solid fa-folder-open text-4xl mb-4" />
              <p className="text-lg">No files have been added yet</p>
              <p className="text-sm">Click Upload to get started</p>
            </div>
          ) : (
            <ul className="divide-y">
              {viewerFiles.map((file) => (
                <li key={file.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{file.title}</p>
                    <a href={file.file_url} target="_blank" className="text-blue-600 text-sm underline">
                      View File
                    </a>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(file.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default FilesPage;
