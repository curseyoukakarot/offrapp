import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AnalyticsCards = () => {
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      // Count users with role 'jobseeker' or 'recruitpro'
      const { count: total, error: totalError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['jobseeker', 'recruitpro']);
      if (!totalError) setTotalClients(total || 0);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  if (loading) {
    return <div className="mb-8">Loading stats...</div>;
  }

    return (
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
            <p className="text-sm text-gray-500">Total Clients</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalClients}</h3>
              </div>
            </div>
            <div className="mt-4 h-16 bg-gray-50 rounded-lg" />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Active Clients</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalClients}</h3>
          </div>
        </div>
        <div className="mt-4 h-16 bg-gray-50 rounded-lg" />
      </div>
      </div>
    );
  };
  
  export default AnalyticsCards;