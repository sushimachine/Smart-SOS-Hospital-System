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
        
        <Route path="/" element={<AdminLayout />}>
          <Route path="/admin" element={<MasterDashboard />} />
          <Route path="/nurse" element={<NurseDashboard />} />
          <Route path="/admin/add" element={<AddInventory />} /> 
        </Route>

        <Route path="/porter" element={<PorterApp />} />
        
      </Routes>
    </Router>
  );
}

export default App;