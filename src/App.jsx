import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout'; 
import Login from './Pages/Login';
import MasterDashboard from './Pages/MasterDashboard';
import AddInventory from './Pages/AddInventory';
import NurseDashboard from './Pages/NurseDashboard';
import PorterApp from './Pages/PorterApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* All Admin/Nurse Routes share the Sidebar Layout */}
        <Route path="/" element={<AdminLayout />}>
          {/* The content of these paths will render inside the <Outlet /> */}
          <Route path="/admin" element={<MasterDashboard />} />
          <Route path="/nurse" element={<NurseDashboard />} />
          <Route path="/admin/add" element={<AddInventory />} /> 
        </Route>

        {/* The Porter App is kept separate, as it's a full-screen mobile view */}
        <Route path="/porter" element={<PorterApp />} />
        
      </Routes>
    </Router>
  );
}

export default App;