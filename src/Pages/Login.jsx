import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

   
    if (data.user.email.includes('nurse')) {
      navigate('/nurse');
    } else {
      navigate('/porter');
    }
  };

  
  const demoLogin = (role) => {
    if (role === 'nurse') {
      setEmail('nurse@hospital.com');
      setPassword('password123');
    } else {
      setEmail('porter@hospital.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Hospital SOS</h1>
          <p className="text-slate-500">Supply Chain Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              placeholder="name@hospital.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-center text-slate-400 uppercase tracking-wide mb-3">
            Judges / Demo Access
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => demoLogin('nurse')}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
            >
              👩‍⚕️ Nurse Demo
            </button>
            <button 
              onClick={() => demoLogin('porter')}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200"
            >
              🚚 Porter Demo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}