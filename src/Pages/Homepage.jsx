import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Activity, Truck, AlertTriangle, ChevronRight, LogIn } from 'lucide-react';

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
      const { count: deliveryCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true }) 
        .eq('status', 'pending');

      const { count: lowStockCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 10);

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
      
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Activity size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Hospital <span className="text-blue-600">OS</span>
          </h1>
        </div>

        <div>
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
          >
            <LogIn size={18} />
            Staff Login
          </button>
        </div>
      </nav>

      <div className="bg-white dark:bg-[#33373E] border-b border-slate-200 pb-16 pt-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Hospital Supply Chain <span className="text-blue-600">OS</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminating stockouts and optimizing drug delivery with real-time tracking and algorithmic rebalancing.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          
          <div className="bg-white dark:bg-[#33373E] p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Deliveries</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.loading ? '...' : stats.pendingDeliveries}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Truck size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#33373E] p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-red-300 transition-colors">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Shortages</p>
              <p className={`text-3xl font-bold mt-1 ${stats.criticalLow > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {stats.loading ? '...' : stats.criticalLow}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stats.criticalLow > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>

           <div className="bg-white dark:bg-[#33373E] p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Units Tracked</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.loading ? '...' : stats.totalStock.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={24} />
            </div>
          </div>

        </div>
      </div>

      <div className="flex-1 bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Select Your Portal</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="group bg-white dark:bg-[#33373E] p-8 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
              
              <div className="relative">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Activity />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600">Medical Staff Access</h3>
                <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                  Log in to manage ward inventory, authorize transfers, and view system audits.
                </p>
                <div className="flex items-center text-blue-600 font-bold text-sm">
                  Login to Console <ChevronRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/login')}
              className="group bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-400 hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
              
              <div className="relative">
                <div className="w-12 h-12 bg-slate-800 text-amber-400 rounded-xl flex items-center justify-center mb-6 border border-slate-700">
                  <Truck />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400">Logistics View</h3>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                  Access the real-time delivery feed and update transport status.
                </p>
                <div className="flex items-center text-amber-400 font-bold text-sm">
                  Porter <ChevronRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <footer className="bg-slate-50 border-t border-slate-200 py-8 text-center">
        <p className="text-slate-400 text-sm">© 2025 Hospital OS • Hackathon Submission</p>
      </footer>

    </div>
  );
}

export default Homepage