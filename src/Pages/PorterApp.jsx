import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Truck, MapPin, CheckCircle, Package } from 'lucide-react';

function PorterApp() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    setupRealtimeSubscription();
  }, []);

  // 1. Initial Load of Pending Tasks
  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          from:locations!from_location_id(name),
          to:locations!to_location_id(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. THE REAL-TIME LISTENER (The "Aha!" Feature)
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('porter-tasks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        async (payload) => {
          // When a new task comes in, we need to fetch its location names
          // (Payload only has IDs, so we re-fetch this specific row)
          const { data } = await supabase
            .from('transactions')
            .select(`
              *,
              from:locations!from_location_id(name),
              to:locations!to_location_id(name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setTasks((prev) => [data, ...prev]);
            // Optional: Browser Sound or Vibration here
            alert(`🚨 NEW TASK: Move ${data.drug_name}!`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // 3. Complete Task Logic (Updates Inventory + Transaction)
  const completeTask = async (task) => {
    const confirm = window.confirm("Confirm delivery of " + task.drug_name + "?");
    if (!confirm) return;

    try {
      // A. Update Transaction Status
      const { error: txError } = await supabase
        .from('transactions')
        .update({ 
          status: 'delivered',
          performed_by_user_id: user?.id // Audit: Porter who finished it
        })
        .eq('id', task.id);

      if (txError) throw txError;

      // B. Update Inventory at Destination (The "Closing the Loop" part)
      // Check if item already exists at destination
      const { data: existingStock } = await supabase
        .from('inventory')
        .select('*')
        .eq('location_id', task.to_location_id)
        .eq('drug_name', task.drug_name)
        .single();

      if (existingStock) {
        // Update existing row
        await supabase
          .from('inventory')
          .update({ quantity: existingStock.quantity + task.qty })
          .eq('id', existingStock.id);
      } else {
        // Create new row (First time this drug is in this ward)
        await supabase
          .from('inventory')
          .insert({
            drug_name: task.drug_name,
            quantity: task.qty,
            location_id: task.to_location_id,
            expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Default 1 year expiry
          });
      }

      // Remove from UI
      setTasks((prev) => prev.filter((t) => t.id !== task.id));

    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-amber-400" /> Logistics View
          </h1>
          <p className="text-slate-400 text-sm">Real-time delivery feed</p>
        </div>
        <div className="bg-green-900 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-700 animate-pulse">
          ● ONLINE
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center text-slate-500 mt-10">Connecting to HQ...</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 opacity-50">
          <CheckCircle size={64} className="text-slate-600 mb-4" />
          <p className="text-xl font-bold">All caught up!</p>
          <p className="text-sm">Waiting for new requests...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-slate-800 rounded-xl overflow-hidden border-l-4 border-amber-400 shadow-lg relative"
            >
              {/* Card Body */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package size={20} className="text-slate-400" />
                    {task.drug_name}
                  </h3>
                  <span className="bg-amber-400 text-black text-xs font-extrabold px-2 py-1 rounded">
                    {task.qty} UNITS
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 min-w-[4px] h-[4px] rounded-full bg-red-500" />
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold">Pick Up From</p>
                      <p className="text-white text-lg font-medium">{task.from?.name || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="pl-[5px] border-l border-dashed border-slate-600 h-4 ml-1.5" />

                  <div className="flex items-start gap-3">
                    <div className="mt-1 min-w-[4px] h-[4px] rounded-full bg-green-500" />
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold">Deliver To</p>
                      <p className="text-white text-lg font-medium">{task.to?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => completeTask(task)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 transition-colors flex items-center justify-center gap-2 active:bg-amber-600"
              >
                <CheckCircle size={20} />
                SWIPE TO CONFIRM DELIVERY
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PorterApp