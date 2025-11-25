import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Package, Activity, Plus, Search, X, Loader2, ArrowRight } from 'lucide-react';

function NurseDashboard() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Request State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestDrug, setRequestDrug] = useState('');
  const [requestQty, setRequestQty] = useState(10); // Default qty
  
  // The "Visual" Process State (0 = Form, 1 = Searching, 2 = Found/Done, 3 = Error)
  const [processStep, setProcessStep] = useState(0); 
  const [algoResult, setAlgoResult] = useState(null); // Stores where we found it

  const MY_WARD_ID = 2; // Hardcoded ICU

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

  const resetModal = () => {
    setIsModalOpen(false);
    setProcessStep(0);
    setRequestDrug('');
    setRequestQty(10);
    setAlgoResult(null);
  };

  // --- THE PROFESSIONAL ALGORITHM ---
  const runSmartAlgorithm = async () => {
    if (!requestDrug || !requestQty) return;
    setProcessStep(1); // Start "Scanning" animation

    try {
      // Step 1: Artificial Delay for "Scanning" visual
      await new Promise(r => setTimeout(r, 800));

      // Query Global Stock
      const { data: globalStock } = await supabase
        .from('inventory')
        .select(`*, locations(name, type)`)
        .eq('drug_name', requestDrug)
        .gt('quantity', 0);

      // Step 2: Artificial Delay for "Analyzing" visual
      await new Promise(r => setTimeout(r, 800));

      if (!globalStock || globalStock.length === 0) {
        setAlgoResult({ error: "Drug unavailable in entire hospital network." });
        setProcessStep(3); // Error State
        return;
      }

      // Logic: Warehouse First -> Then Surplus Wards
      let bestSource = null;
      let sourceName = '';
      let sourceType = '';

      const warehouse = globalStock.find(item => item.locations.type === 'warehouse' && item.quantity >= requestQty);

      if (warehouse) {
        bestSource = warehouse;
        sourceName = warehouse.locations.name;
        sourceType = 'Central Supply';
      } else {
        // Warehouse empty or insufficient? Find richest ward
        const richestWard = globalStock
          .filter(item => item.location_id !== MY_WARD_ID && item.quantity >= requestQty)
          .sort((a, b) => b.quantity - a.quantity)[0];

        if (richestWard) {
          bestSource = richestWard;
          sourceName = richestWard.locations.name;
          sourceType = 'Surplus Rebalance';
        } else {
          setAlgoResult({ error: `Not enough stock found. Max available: ${globalStock.reduce((a,b)=>a+b.quantity,0)}` });
          setProcessStep(3);
          return;
        }
      }

      // Step 3: Execute
      const { error } = await supabase.from('transactions').insert({
        drug_name: requestDrug,
        qty: requestQty,
        from_location_id: bestSource.location_id,
        to_location_id: MY_WARD_ID,
        status: 'pending',
        performed_by_user_id: user?.id 
      });

      if (error) throw error;

      // Success State
      setAlgoResult({ source: sourceName, type: sourceType });
      setProcessStep(2); // Done State
      fetchInventory(); // Refresh table behind modal

    } catch (error) {
      console.error(error);
      setAlgoResult({ error: "System Error." });
      setProcessStep(3);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
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

      {/* Main Inventory Table */}
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
               <tr><td colSpan="4" className="p-8 text-center text-slate-400">No stock recorded.</td></tr>
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

      {/* --- PROFESSIONAL REQUEST MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Request Stock</h3>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              
              {/* STEP 0: THE FORM */}
              {processStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drug Name</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={requestDrug}
                        onChange={(e) => setRequestDrug(e.target.value)}
                        placeholder="e.g. Adrenaline" 
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity Needed</label>
                    <input 
                      type="number" 
                      value={requestQty}
                      onChange={(e) => setRequestQty(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    />
                  </div>

                  <button 
                    onClick={runSmartAlgorithm}
                    disabled={!requestDrug || !requestQty}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all shadow-lg shadow-blue-200"
                  >
                    Locate & Request Stock <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* STEP 1: PROCESSING VISUAL (The "Smart" part) */}
              {processStep === 1 && (
                <div className="py-8 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Optimizing Supply Chain...</h4>
                    <p className="text-sm text-slate-500">Scanning warehouse and surplus wards</p>
                  </div>
                  
                  {/* The Checklist Visual */}
                  <div className="max-w-[200px] mx-auto text-left space-y-2 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                       <CheckCircle size={16} className="text-green-500" /> Database Connection
                    </div>
                    <div className="flex items-center gap-2">
                       <Loader2 size={16} className="animate-spin text-blue-500" /> Checking Availability
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SUCCESS RESULT */}
              {processStep === 2 && (
                <div className="py-4 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Stock Secured!</h4>
                  
                  <div className="bg-slate-50 rounded-lg p-4 mt-4 text-left border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Source</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{algoResult?.type}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{algoResult?.source}</p>
                    <p className="text-sm text-slate-500">Porter has been dispatched.</p>
                  </div>

                  <button 
                    onClick={resetModal}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl mt-6"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* STEP 3: FAILURE */}
              {processStep === 3 && (
                <div className="py-4 text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Request Failed</h4>
                  <p className="text-red-600 mt-2 font-medium">{algoResult?.error}</p>
                  
                  <button 
                    onClick={() => setProcessStep(0)}
                    className="w-full border border-slate-300 text-slate-700 font-bold py-3 rounded-xl mt-6 hover:bg-slate-50"
                  >
                    Try Different Amount
                  </button>
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