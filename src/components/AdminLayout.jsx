import { Outlet, Link } from 'react-router-dom';

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6 text-blue-400">Hospital OS</h2>
        
        <nav className="space-y-2">
          <Link to="/admin" className="block p-2 rounded hover:bg-gray-700">Dashboard</Link>
          <Link to="/nurse" className="block p-2 rounded hover:bg-gray-700">Nurse Request (SOS)</Link>
          <Link to="/admin/add" className="block p-2 rounded hover:bg-gray-700">Add New Stock</Link>
          
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet /> 
      </main>
    </div>
  );
}

export default AdminLayout