import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('id, email');
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file || !selectedUser || !title) return alert('Please fill all fields');

    // 1. Upload file to Supabase Storage
    const filePath = `${selectedUser}/${file.name}`;
    const { data: storageData, error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return alert('Upload failed');
    }

    const { data: { session } } = await supabase.auth.getSession();
    const fileUrl = `https://tywemactebkksgdsleha.supabase.co/storage/v1/object/public/user-files/${filePath}`;

    // 2. Insert file record into DB
    await supabase.from('files').insert([
      {
        user_id: selectedUser,
        file_url: fileUrl,
        title,
        uploaded_by: session.user.id,
      },
    ]);

    alert('File uploaded and assigned!');
    setFile(null);
    setTitle('');
    setSelectedUser('');
  };

  return (
    <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-lg font-bold">Upload File for a User</h2>

      <input
        type="text"
        placeholder="Title (e.g. Resume Draft)"
        className="w-full border p-2 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">Select a user</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>{user.email}</option>
        ))}
      </select>

      <input
        type="file"
        className="w-full"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Upload & Assign
      </button>
    </form>
  );
};

export default FileUpload;