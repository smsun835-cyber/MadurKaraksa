import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RTBilling from './pages/RT03Billing'; // Halaman RT 03 yang dibuat sebelumnya
import RT01Billing from './pages/RT01Billing';
import RT02Billing from './pages/RT02Billing';
import Login from './pages/login';
// Jangan lupa import komponen barunya di bagian paling atas
import LaporanKegiatan from './pages/LaporanKegiatan';
// Tambahkan di dalam <Routes> Anda
function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/rt-01", element: _jsx(RT01Billing, {}) }), _jsx(Route, { path: "/rt-02", element: _jsx(RT02Billing, {}) }), _jsx(Route, { path: "/rt-03", element: _jsx(RTBilling, {}) }), _jsx(Route, { path: "/laporan-kegiatan", element: _jsx(LaporanKegiatan, {}) })] }));
}
export default App;
