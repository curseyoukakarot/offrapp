import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';

const FormResponses = () => {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [formTitle, setFormTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: formData } = await supabase
        .from('forms')
        .select('title')
        .eq('id', id)
        .single();
      setFormTitle(formData?.title || 'Untitled Form');

      const { data: responseData } = await supabase
        .from('form_responses')
        .select('*')
        .filter('form_id', 'eq', id)
        .order('created_at', { ascending: false });

      setResponses(Array.isArray(responseData) ? responseData : []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getFullName = (answers) => {
    if (!answers || typeof answers !== 'object') return '—';

    const firstNameKey = Object.keys(answers).find((key) =>
      key.toLowerCase().includes('first name')
    );
    const lastNameKey = Object.keys(answers).find((key) =>
      key.toLowerCase().includes('last name')
    );

    const first = answers[firstNameKey]?.trim();
    const last = answers[lastNameKey]?.trim();

    if (first && last) return `${first} ${last}`;
    if (first) return first;
    return '—';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8 ml-64 relative">
        <h1 className="text-2xl font-bold mb-6">Responses: {formTitle}</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="overflow-auto bg-white rounded-xl shadow border border-gray-200">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 border-b text-gray-700">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4">Resume/File</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((res) => (
                    <tr
                      key={res.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedResponse(res)}
                    >
                      <td className="py-3 px-4 text-gray-700">
                        {getFullName(res.answers)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(res.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {Object.values(res.answers).some((ans) =>
                          typeof ans === 'string' && ans.startsWith('http')
                        ) ? (
                          <a
                            href={Object.values(res.answers).find(
                              (ans) => typeof ans === 'string' && ans.startsWith('http')
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View File
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-blue-500">View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedResponse && (
              <div className="absolute top-0 right-0 w-1/2 h-full bg-white shadow-xl border-l border-gray-200 p-6 overflow-y-auto z-10">
                <button
                  className="text-sm text-red-600 mb-4 hover:underline"
                  onClick={() => setSelectedResponse(null)}
                >
                  Close
                </button>

                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Full Response Details
                </h2>

                <div className="text-gray-700 text-sm space-y-4">
                  {Object.entries(selectedResponse.answers).map(([question, answer], i) => (
                    <div key={i}>
                      <p className="font-semibold">{question}</p>
                      {typeof answer === 'string' && answer.startsWith('http') ? (
                        <a
                          href={answer}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          View File
                        </a>
                      ) : typeof answer === 'string' ? (
                        answer.split('\n').map((line, j) => (
                          <p key={j} className="whitespace-pre-line">{line}</p>
                        ))
                      ) : (
                        <p className="text-red-500">⚠️ Invalid answer</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default FormResponses;

