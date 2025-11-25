import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Package, Activity, Plus, Search, X, Server } from 'lucide-react';

function NurseDashboard() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestDrug, setRequestDrug] = useState('');
  const [algoLogs, setAlgoLogs] = useState([]); 
  const [isSearching, setIsSearching] = useState(false);

  const MY_WARD_ID = 2; 

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await supabase
        .from('inventory')
        .select(`*, locations(name)`)
        .eq('location_id', MY_WARD_ID)
        .order('quantity', { ascending: true });
      setInventory(data || []);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const runSmartAlgorithm = async () => {
    if (!requestDrug) return;
    setIsSearching(true);
    setAlgoLogs([]); 

    const addLog = (text, type = 'info') => {
      setAlgoLogs(prev => [...prev, { text, type }]);
    };

    try {
      addLog("📡 Connecting to Hospital Grid...", 'info');
      await new Promise(r => setTimeout(r, 600)); 

      const { data: globalStock } = await supabase
        .from('inventory')
        .select(`*, locations(name, type)`)
        .eq('drug_name', requestDrug)
        .gt('quantity', 0); 

      if (!globalStock || globalStock.length === 0) {
        addLog("❌ CRITICAL: Drug not found in entire hospital network.", 'error');
        setIsSearching(false);
        return;
      }

      addLog("🏭 Checking Central Warehouse...", 'info');
      await new Promise(r => setTimeout(r, 600));

      const warehouse = globalStock.find(item => item.locations.type === 'warehouse');
      let bestSource = null;

      if (warehouse) {
        addLog("✅ Stock found in Warehouse. Allocating...", 'success');
        bestSource = warehouse;
      } else {
        addLog("⚠️ Warehouse Empty! Initiating Peer-to-Peer Scan...", 'warning');
        await new Promise(r => setTimeout(r, 800));

        const richestWard = globalStock
          .filter(item => item.location_id !== MY_WARD_ID)
          .sort((a, b) => b.quantity - a.quantity)[0];

        if (richestWard) {
          addLog(`🚑 ALGORITHM MATCH: Stealing stock from ${richestWard.locations.name} (Qty: ${richestWard.quantity})`, 'success');
          bestSource = richestWard;
        } else {
          addLog("❌ No surplus stock available in other wards.", 'error');
          setIsSearching(false);
          return;
        }
      }

      await new Promise(r => setTimeout(r, 600));
      addLog("🚚 Dispatching Porter Request...", 'info');

      const { error } = await supabase.from('transactions').insert({
        drug_name: requestDrug,
        qty: 20, 
        from_location_id: bestSource.location_id,
        to_location_id: MY_WARD_ID,
        status: 'pending',
        performed_by_user_id: user?.id 
      });

      if (error) throw error;

      addLog("✨ SUCCESS: Request Queued in Real-time System.", 'done');
      
      fetchInventory();

    } catch (error) {
      addLog("Error executing algorithm.", 'error');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ICU Ward Inventory</h2>
          <p className="text-slate-500">Manage stock & initiate transfers</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          <Plus size={20} />
          New Request
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
            <tr>
              <th className="p-4 font-medium">Drug Name</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Current Qty</th>
              <th className="p-4 font-medium text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : inventory.length === 0 ? (
               <tr><td colSpan="4" className="p-8 text-center text-slate-400">No stock recorded. Click "New Request" to order.</td></tr>
            ) : inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{item.drug_name}</td>
                  <td className="p-4">
                    {item.quantity < 10 ? (
                      <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">LOW STOCK</span>
                    ) : (
                      <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">OK</span>
                    )}
                  </td>
                  <td className="p-4 font-medium">{item.quantity}</td>
                  <td className="p-4 text-right">
                    {item.quantity < 10 && (
                      <button 
                         onClick={() => {
                           setRequestDrug(item.drug_name);
                           setIsModalOpen(true);
                         }}
                         className="text-red-600 text-sm font-bold hover:underline"
                      >
                        SOS Restock
                      </button>
                    )}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <Activity className="text-blue-400" />
                <h3 className="font-bold text-lg">Smart Supply Request</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!isSearching && algoLogs.length === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Medicine Needed</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                      <input 
                        type="text" 
                        value={requestDrug}
                        onChange={(e) => setRequestDrug(e.target.value)}
                        placeholder="e.g. Adrenaline, Morphine..." 
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      System will automatically scan all wards for availability.
                    </p>
                  </div>

                  <button 
                    onClick={runSmartAlgorithm}
                    disabled={!requestDrug}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Server size={20} />
                    Run Auto-Allocation Algorithm
                  </button>
                </>
              )}

              {(isSearching || algoLogs.length > 0) && (
                <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm h-64 overflow-y-auto border border-slate-700 shadow-inner">
                  {algoLogs.map((log, i) => (
                    <div key={i} className={`mb-2 ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'success' ? 'text-green-400' : 
                      log.type === 'warning' ? 'text-amber-400' : 
                      log.type === 'done' ? 'text-blue-400 font-bold' :
                      'text-slate-300'
                    }`}>
                      <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                      {log.text}
                    </div>
                  ))}
                  {isSearching && (
                    <div className="text-blue-500 animate-pulse">_ Processing request logic...</div>
                  )}
                  
                  {algoLogs.some(l => l.type === 'done') && (
                     <button 
                       onClick={() => setIsModalOpen(false)}
                       className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded border border-slate-600"
                     >
                       Close Console
                     </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default NurseDashboard