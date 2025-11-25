import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { LayoutDashboard, Truck, PackagePlus, Activity } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1
        ${isActive(to) 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0">
        
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Activity className="text-blue-500 mr-2" />
          <h1 className="text-white font-bold text-lg tracking-wide">
            Hospital <span className="text-blue-500">OS</span>
          </h1>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          <p className="px-4 text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">
            Main Menu
          </p>
          <NavItem to="/admin" icon={LayoutDashboard} label="Master Overview" />
          <NavItem to="/nurse" icon={Activity} label="Ward Request (SOS)" />
          
          <p className="px-4 text-xs font-bold text-slate-600 uppercase mt-8 mb-2 tracking-wider">
            Inventory Ops
          </p>
          <NavItem to="/admin/add" icon={PackagePlus} label="Add Stock" />
          <NavItem to="/porter" icon={Truck} label="Logistics View" />
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-600 text-center">
          v1.0 Hackathon Build
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet /> 
        </main>
      </div>

    </div>
  );
}