import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, AlertTriangle, Package, TrendingUp } from 'lucide-react';

function MasterDashboard() {
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStockCount: 0,
    totalValue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: inventory } = await supabase.from('inventory').select('*');
      
      const totalStock = inventory?.reduce((acc, item) => acc + item.quantity, 0) || 0;
      const lowStockCount = inventory?.filter(item => item.quantity < 10).length || 0;
      const totalValue = totalStock * 125; 

      setStats({ totalStock, lowStockCount, totalValue });

      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          from:locations!from_location_id(name),
          to:locations!to_location_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10); 

      setRecentActivity(transactions || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Hospital Data...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hospital Overview</h1>
        <p className="text-slate-500">Live operational status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase">Total Inventory</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalStock.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={24} />
            </div>
          </div>
          <p className="text-xs text-green-600 font-bold flex items-center gap-1">
            <TrendingUp size={12} /> +12% from last week
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase">Est. Stock Value</p>
              <h3 className="text-3xl font-bold text-slate-800">₹ {stats.totalValue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Activity size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Updated in real-time</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase">Critical Alerts</p>
              <h3 className={`text-3xl font-bold ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {stats.lowStockCount}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-xs text-red-600 font-bold">
            Items below minimum threshold
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">Recent Supply Chain Activity</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Drug</th>
              <th className="px-6 py-4">Movement</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentActivity.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{tx.drug_name}</td>
                <td className="px-6 py-4 text-slate-600">
                  {tx.from?.name} <span className="text-slate-300 mx-2">→</span> {tx.to?.name}
                </td>
                
                <td className="px-6 py-4">
                  {tx.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      WAITING
                    </span>
                  )}
                  {tx.status === 'in_transit' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      ON THE WAY
                    </span>
                  )}
                  {tx.status === 'delivered' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      DELIVERED
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-slate-400">
                  {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MasterDashboard;