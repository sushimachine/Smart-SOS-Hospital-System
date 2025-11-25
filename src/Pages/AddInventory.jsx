import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; // For Audit Trail
import { PackagePlus, Save, CheckCircle } from 'lucide-react';

function AddInventory() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    drug_name: '',
    quantity: '',
    location_id: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  // 1. Fetch Locations for the Dropdown
  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*');
    setLocations(data || []);
  };

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Submit Data to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('inventory').insert([
        {
          drug_name: formData.drug_name,
          quantity: parseInt(formData.quantity),
          location_id: parseInt(formData.location_id),
          expiry_date: formData.expiry_date,
          // Audit Trail (Optional: You can add last_updated_by if column exists)
          // last_updated_by_user_id: user?.id 
        }
      ]);

      if (error) throw error;

      // Success Feedback
      setSuccess(true);
      setFormData({ drug_name: '', quantity: '', location_id: '', expiry_date: '' }); // Reset form
      setTimeout(() => setSuccess(false), 3000); // Hide success after 3s

    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <PackagePlus className="text-blue-600" />
          Inward Supply Entry
        </h1>
        <p className="text-slate-500">Register new incoming medicine batches.</p>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse">
          <CheckCircle size={20} />
          <span className="font-bold">Stock Added Successfully!</span> Database updated.
        </div>
      )}

      {/* The Form */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Drug Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Drug / Medicine Name</label>
            <input
              required
              type="text"
              name="drug_name"
              value={formData.drug_name}
              onChange={handleChange}
              placeholder="e.g. Paracetamol 500mg"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Quantity (Units)</label>
              <input
                required
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Expiry Date</label>
              <input
                required
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Storage Location</label>
            <div className="relative">
              <select
                required
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
              >
                <option value="">Select a Location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type.toUpperCase()})
                  </option>
                ))}
              </select>
              {/* Custom Arrow Icon */}
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : (
              <>
                <Save size={20} /> Add to Inventory
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AddInventory