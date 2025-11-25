import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, User, Bell } from 'lucide-react'; 

function Navbar({ userEmail }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Also clear our "hacky" demo storage if we used it
    localStorage.removeItem('hospital_user_role'); 
    navigate('/');
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
      {/* Left Side: Context/Breadcrumb (Optional) */}
      <div className="text-slate-500 text-sm font-medium">
        Hospital Supply Chain <span className="text-slate-300 mx-2">/</span> <span className="text-blue-600">Overview</span>
      </div>

      {/* Right Side: User Profile & Actions */}
      <div className="flex items-center gap-6">
        
        {/* Notification Icon (Visual Only) */}
        <button className="relative text-slate-400 hover:text-slate-600 transition">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700">
              {userEmail || 'Medical Staff'}
            </p>
            <p className="text-xs text-slate-400">
              Logged in
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-blue-200">
            <User size={20} />
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-600 transition hover:bg-red-50 rounded-lg"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar