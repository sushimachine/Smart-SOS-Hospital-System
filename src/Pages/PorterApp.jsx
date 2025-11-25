import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Truck, CheckCircle, Package, ArrowRight, Play, Clock, User } from 'lucide-react';

function PorterApp() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const isPorter = user?.email?.includes('porter');

  useEffect(() => {
    fetchTasks();
    setupRealtimeSubscription();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          from:locations!from_location_id(name),
          to:locations!to_location_id(name)
        `)
        .in('status', ['pending', 'in_transit'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('porter-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        async (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new.status === 'delivered') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.new.id));
            return;
          }

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
             setTasks((prev) => {
                const exists = prev.find(t => t.id === data.id);
                if (exists) return prev.map(t => t.id === data.id ? data : t);
                return [data, ...prev];
             });
             
             if (payload.eventType === 'INSERT' && isPorter) {
                alert(`🚨 NEW TASK: Move ${data.drug_name}!`);
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startDelivery = async (task) => {
    try {
      await supabase.from('transactions').update({ status: 'in_transit' }).eq('id', task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'in_transit' } : t));
    } catch (error) {
      alert("Error starting delivery");
    }
  };

  const completeDelivery = async (task) => {
    if (!window.confirm(`Confirm delivery of ${task.drug_name}?`)) return;

    try {
      await supabase.from('transactions')
        .update({ status: 'delivered', performed_by_user_id: user?.id })
        .eq('id', task.id);

      const { data: existingStock } = await supabase
        .from('inventory')
        .select('*')
        .eq('location_id', task.to_location_id)
        .eq('drug_name', task.drug_name)
        .single();

      if (existingStock) {
        await supabase.from('inventory').update({ quantity: existingStock.quantity + task.qty }).eq('id', existingStock.id);
      } else {
        await supabase.from('inventory').insert({
          drug_name: task.drug_name,
          quantity: task.qty,
          location_id: task.to_location_id,
          expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });
      }

      setTasks(prev => prev.filter(t => t.id !== task.id));

    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="flex items-center justify-between mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-blue-500" /> Logistics View
          </h1>
          <p className="text-slate-400 text-sm">
            {isPorter ? 'Real-time delivery feed' : 'Live Tracking Dashboard'}
          </p>
        </div>
        
        {isPorter ? (
          <div className="bg-green-900 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-700 animate-pulse">
            ● ONLINE (PORTER)
          </div>
        ) : (
          <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700 flex items-center gap-2">
            <User size={12} /> READ ONLY
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 mt-10">Connecting to HQ...</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 opacity-50">
          <CheckCircle size={64} className="text-slate-600 mb-4" />
          <p className="text-xl font-bold">All caught up!</p>
          <p className="text-sm">No active movements.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isInTransit = task.status === 'in_transit';
            
            return (
              <div 
                key={task.id} 
                className={`rounded-xl overflow-hidden border-l-4 shadow-lg relative transition-all duration-300
                  ${isInTransit ? 'bg-slate-800 border-blue-500' : 'bg-slate-800 border-amber-400'}`}
              >
                <div className={`px-4 py-1 text-xs font-bold text-black uppercase flex justify-between items-center
                  ${isInTransit ? 'bg-blue-500' : 'bg-amber-400'}`}>
                  <span>{isInTransit ? '🚀 ON THE WAY' : '⚠️ REQUEST PENDING'}</span>
                  <span>{new Date(task.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Package size={20} className="text-slate-400" />
                      {task.drug_name}
                    </h3>
                    <span className="bg-slate-700 text-white text-xs font-extrabold px-2 py-1 rounded border border-slate-600">
                      {task.qty} UNITS
                    </span>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className={`flex items-center gap-3 p-2 rounded-lg ${isInTransit ? 'opacity-50' : 'bg-slate-700/50'}`}>
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div>
                        <p className="text-slate-400 text-xs uppercase font-bold">Pick Up</p>
                        <p className="text-white font-medium">{task.from?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center -my-2 opacity-30">
                      <ArrowRight className="rotate-90" size={16} />
                    </div>

                    <div className={`flex items-center gap-3 p-2 rounded-lg ${isInTransit ? 'bg-blue-900/30 border border-blue-500/30' : 'opacity-50'}`}>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div>
                        <p className="text-slate-400 text-xs uppercase font-bold">Drop Off</p>
                        <p className="text-white font-medium">{task.to?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {isPorter ? (
                  isInTransit ? (
                    <button
                      onClick={() => completeDelivery(task)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      CONFIRM ARRIVAL
                    </button>
                  ) : (
                    <button
                      onClick={() => startDelivery(task)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play size={20} fill="black" />
                      ACCEPT TASK
                    </button>
                  )
                ) : (
                  <div className="w-full bg-slate-900/50 py-4 flex items-center justify-center gap-2 text-slate-400 border-t border-slate-700 font-medium">
                    {isInTransit ? (
                      <>
                        <Truck size={18} className="animate-bounce" />
                        Porter is moving the stock...
                      </>
                    ) : (
                      <>
                        <Clock size={18} />
                        Waiting for Porter to Accept...
                      </>
                    )}
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PorterApp