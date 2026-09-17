import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { Setup2FAPage } from './pages/auth/Setup2FAPage';
import { Verify2FAPage } from './pages/auth/Verify2FAPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AdminManagementPage } from './pages/dashboard/AdminManagementPage';
import { DisputesPage } from './pages/dashboard/DisputesPage';
import { PrinterAgentsPage } from './pages/dashboard/PrinterAgentsPage';

function App() {
 return (
 <BrowserRouter>
 <Routes>
 {/* Auth Routes */}
 <Route element={<AuthLayout />}>
 <Route path="/login" element={<LoginPage />} />
 <Route path="/setup-2fa" element={<Setup2FAPage />} />
 <Route path="/verify-2fa" element={<Verify2FAPage />} />
 </Route>

 {/* Protected Admin Routes */}
 <Route element={<AdminLayout />}>
 <Route path="/" element={<DashboardPage />} />
 <Route path="/manage" element={<AdminManagementPage />} />
 <Route path="/disputes" element={<DisputesPage />} />
 <Route path="/printer-agents" element={<PrinterAgentsPage />} />
 </Route>

 {/* Explicit index.html handler for static hosts */}
 <Route path="/index.html" element={<Navigate to="/" replace />} />

 {/* Catch all */}
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </BrowserRouter>
 );
}

export default App;
