import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import ConsumerLayout from './components/layouts/ConsumerLayout';
import ManufacturerLayout from './components/layouts/ManufacturerLayout';

// Consumer Pages
import Landing from './pages/Landing';
import Scanner from './pages/Scanner';
import About from './pages/About';

// Manufacturer Pages
import Manufacturer from './pages/manufacturer/Manufacturer';

function AppRoutes() {
  return (
    <Routes>
      {/* Consumer Portal */}
      <Route element={<ConsumerLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Manufacturer Portal */}
      <Route path="/manufacturer" element={<Manufacturer />} />

      {/* Old routes redirects to keep it clean */}
      <Route path="/dashboard" element={<Navigate to="/manufacturer" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
