import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';

// Layouts
import ConsumerLayout from './components/layouts/ConsumerLayout';
import ManufacturerLayout from './components/layouts/ManufacturerLayout';

// Consumer Pages (UNTOUCHED)
import Landing from './pages/Landing';
import Scanner from './pages/Scanner';
import About from './pages/About';
import ProductDetail from './pages/ProductDetail';

// Manufacturer Pages (REBUILT)
import Login from './pages/manufacturer/Login';
import Register from './pages/manufacturer/Register';
import ManufacturerDashboard from './pages/manufacturer/ManufacturerDashboard';
import Products from './pages/manufacturer/Products';
import Batches from './pages/manufacturer/Batches';
import QRCenter from './pages/manufacturer/QRCenter';

function AppRoutes() {
  return (
    <Routes>
      {/* ═══ Consumer Portal (public, no auth) ═══ */}
      <Route element={<ConsumerLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Consumer QR deep-link: /scan/:batchId — auto-loads product data */}
      <Route path="/scan/:batchId" element={<ProductDetail />} />
      
      {/* Legacy product route */}
      <Route path="/product/:batchId" element={<ProductDetail />} />

      {/* ═══ Manufacturer Portal (auth protected) ═══ */}
      <Route path="/manufacturer" element={<ManufacturerLayout />}>
        {/* Auth pages (rendered without sidebar) */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        
        {/* Protected pages (rendered with sidebar) */}
        <Route path="dashboard" element={<ManufacturerDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="batches" element={<Batches />} />
        <Route path="qr-center" element={<QRCenter />} />
        
        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ═══ Legacy redirects ═══ */}
      <Route path="/dashboard" element={<Navigate to="/manufacturer/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
