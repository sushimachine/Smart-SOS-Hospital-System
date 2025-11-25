import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { LayoutDashboard, Truck, PackagePlus, Activity, Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true); 
  
  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link 
      to={to} 
      className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 mb-1 group relative
        ${isSidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'} 
        ${isActive(to) 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon size={24} className={`min-w-[24px] ${!isSidebarOpen && isActive(to) ? 'text-white' : ''}`} />
      
      <span className={`font-medium whitespace-nowrap transition-all duration-200 origin-left
        ${isSidebarOpen ? 'opacity-100 scale-100' : 'hidden opacity-0 scale-0 w-0'}`}>
        {label}
      </span>

      {!isSidebarOpen && (
        <div className="absolute left-full ml-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none border border-slate-700">
          {label}
        </div>
      )}
    </Link>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 transition-all duration-300 ease-in-out`}
      >
        
        <div className={`h-16 flex items-center border-b border-slate-800 transition-all
          ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center px-0'}`}>
          
          {isSidebarOpen && (
            <div className="flex items-center overflow-hidden whitespace-nowrap">
              <Activity className="text-blue-500 mr-2 min-w-[20px]" />
              <h1 className="text-white font-bold text-lg tracking-wide">
                Hospital <span className="text-blue-500">OS</span>
              </h1>
            </div>
          )}

          <button 
            onClick={toggleSidebar} 
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer rounded "
          >
            {isSidebarOpen ? <Menu size={20} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1 overflow-x-hidden">
          {isSidebarOpen && (
            <p className="px-4 text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider animate-in fade-in duration-300">
              Main Menu
            </p>
          )}
          
          <NavItem to="/admin" icon={LayoutDashboard} label="Master Overview" />
          <NavItem to="/nurse" icon={Activity} label="Ward Request (SOS)" />
          
          {isSidebarOpen && (
            <div className="my-8 h-px bg-slate-800" /> 
          )}

          {isSidebarOpen && (
             <p className="px-4 text-xs font-bold text-slate-600 uppercase mt-4 mb-2 tracking-wider animate-in fade-in duration-300">
             Inventory Ops
           </p>
          )}

          <NavItem to="/admin/add" icon={PackagePlus} label="Add Stock" />
          <NavItem to="/admin/logistics" icon={Truck} label="Logistics View" />
        </div>

      </aside>

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet /> 
        </main>
      </div>

    </div>
  );
}