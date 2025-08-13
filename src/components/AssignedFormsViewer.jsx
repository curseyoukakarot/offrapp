import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useUser } from '../lib/useUser';

export default function AssignedFormsViewer() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      const r = userRow?.role || 'authenticated';
      setRole(r);
      // fetch forms assigned to this role (limit 2)
      const { data } = await supabase
        .from('forms')
        .select('id, title, description, created_at, assigned_roles')
        .contains('assigned_roles', [r])
        .order('created_at', { ascending: false })
        .limit(2);
      setForms(data || []);
      setLoading(false);
    };
    init();
  }, [user?.id]);

  if (loading) return null;
  if (!forms.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"> 
        <p className="text-gray-600 text-sm">No assigned forms at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {forms.map((f) => (
        <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-clipboard-list text-orange-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-900">{f.title}</h4>
                <p className="text-sm text-gray-500">{f.description || 'Form assigned to your role'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                onClick={() => navigate(`/forms/${f.id}`)}
              >
                Open
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


