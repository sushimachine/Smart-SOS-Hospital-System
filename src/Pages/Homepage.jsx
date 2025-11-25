import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Activity, Truck, AlertTriangle, ChevronRight } from 'lucide-react'; // Make sure to install lucide-react if you haven't

function Homepage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingDeliveries: 0,
    criticalLow: 0,
    totalStock: 0,
    loading: true
  });

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const fetchLiveStats = async () => {
    try {
      // 1. Get Pending Deliveries Count
      const { count: deliveryCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true }) // 'head: true' means we only want the count, not the data (faster)
        .eq('status', 'pending');

      // 2. Get Critical Low Stock Count (< 10 units)
      const { count: lowStockCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 10);

      // 3. Get Total Stock Volume (Summing manually for hackathon speed)
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('quantity');
      
      const totalVolume = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setStats({
        pendingDeliveries: deliveryCount || 0,
        criticalLow: lowStockCount || 0,
        totalStock: totalVolume,
        loading: false
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* --- HERO SECTION --- */}
      <div className="bg-white border-b border-slate-200 pb-16 pt-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Hospital Supply Chain <span className="text-blue-600">OS</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            A real-time inventory orchestration system that eliminates stockouts, 
            automates rebalancing, and tracks every drug movement.
          </p>
        </div>

        {/* --- THE LIVE PULSE STRIP (The "Dashboard-like" feature) --- */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          
          {/* Stat Card 1: Active Deliveries */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500 uppercase">Active Porters</p>
              <p className="text-3xl font-bold text-slate-800">
                {stats.loading ? '...' : stats.pendingDeliveries}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Truck size={24} />
            </div>
          </div>

          {/* Stat Card 2: Critical Alerts */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500 uppercase">Critical Shortages</p>
              <p className={`text-3xl font-bold ${stats.criticalLow > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {stats.loading ? '...' : stats.criticalLow}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stats.criticalLow > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>

           {/* Stat Card 3: Total Volume */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500 uppercase">Total Units Tracked</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.loading ? '...' : stats.totalStock.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={24} />
            </div>
          </div>

        </div>
      </div>

      {/* --- ENTRY POINTS --- */}
      <div className="flex-1 bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Select Your Portal</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Medical Staff Card */}
            <button 
              onClick={() => navigate('/login')} // Send to login
              className="group bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600">Medical Staff Access</h3>
              <p className="text-slate-500 mb-6">Manage ward inventory, request emergency stock, and view audit logs.</p>
              <div className="flex items-center text-blue-600 font-semibold">
                Login to Console <ChevronRight className="ml-2 w-4 h-4" />
              </div>
            </button>

            {/* Logistics Card */}
            <button 
              onClick={() => navigate('/login')} // Send to login
              className="group bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-400 hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-slate-800 text-amber-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400">Logistics & Porter</h3>
              <p className="text-slate-400 mb-6">View real-time delivery tasks, route optimization, and delivery confirmation.</p>
              <div className="flex items-center text-amber-400 font-semibold">
                Access Mobile App <ChevronRight className="ml-2 w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Homepage