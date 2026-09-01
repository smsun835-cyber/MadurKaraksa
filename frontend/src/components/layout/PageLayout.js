import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { account, getUserRole } from '../../services/appwriteConfig';
export default function PageLayout({ children, activeMenu }) {
    const [userRole, setUserRole] = useState('warga');
    const [userName, setUserName] = useState('Pengunjung');
    const navigate = useNavigate();
    useEffect(() => {
        async function checkUserSession() {
            const role = await getUserRole();
            setUserRole(role);
            try {
                const user = await account.get();
                if (user && user.name) {
                    setUserName(user.name);
                }
            }
            catch (err) {
                // Belum login (sebagai warga)
                setUserName('Warga / Tamu');
            }
        }
        checkUserSession();
    }, []);
    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            alert('Berhasil logout!');
            setUserRole('warga');
            navigate('/');
            window.location.reload();
        }
        catch (error) {
            console.error('Gagal logout:', error);
            alert('Terjadi kesalahan saat logout.');
        }
    };
    return (_jsxs("div", { className: "bg-slate-50 font-sans text-slate-800 h-screen overflow-hidden flex", children: [_jsxs("aside", { className: "w-64 bg-white border-r border-slate-200 flex flex-col h-full justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "p-6", children: [_jsxs("h1", { className: "text-xl font-bold text-blue-900 leading-tight", children: ["Madur Raksa", _jsx("br", {})] }), _jsxs("div", { className: "mt-2 flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-800 text-white rounded flex items-center justify-center font-bold", children: userName.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold leading-none", children: userName }), _jsxs("p", { className: "text-xs text-slate-500 uppercase", children: ["Role: ", userRole] })] })] })] }), _jsxs("nav", { className: "px-4 space-y-1 overflow-y-auto", children: [_jsx(MenuLink, { to: "/", icon: "\uD83D\uDCCA", label: "Dashboard", isActive: activeMenu === 'dashboard' }), _jsx(MenuLink, { to: "/rt-01", icon: "\uD83D\uDCB5", label: "RT 01 Billing", isActive: activeMenu === 'rt01' }), _jsx(MenuLink, { to: "/rt-02", icon: "\uD83D\uDCB5", label: "RT 02 Billing", isActive: activeMenu === 'rt02' }), _jsx(MenuLink, { to: "/rt-03", icon: "\uD83D\uDCB5", label: "RT 03 Billing", isActive: activeMenu === 'rt03' }), (userRole === 'bendahara' || userRole === 'admin') && (_jsx(MenuLink, { to: "/laporan-kegiatan", icon: "\uD83D\uDCCB", label: "Laporan Kegiatan", isActive: activeMenu === 'kegiatan' }))] })] }), _jsx("div", { className: "p-4 border-t border-slate-100", children: userRole !== 'warga' ? (_jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 transition", children: [_jsx("span", { children: "\uD83D\uDEAA" }), " Logout"] })) : (_jsx(Link, { to: "/login", className: "block text-center bg-blue-50 text-blue-900 border border-blue-200 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-blue-100 transition shadow-sm", children: "\uD83D\uDD10 Login Admin / Barudak" })) })] }), _jsxs("div", { className: "flex-1 flex flex-col h-full overflow-hidden", children: [_jsxs("header", { className: "bg-white h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsx("button", { className: "md:hidden text-slate-600 text-2xl", children: "\u2630" }) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "hidden md:block relative", children: _jsx("input", { type: "text", placeholder: "Search records...", className: "bg-white border border-slate-300 rounded-lg py-1.5 px-4 text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none" }) }), _jsx("button", { className: "text-xl", children: "\uD83D\uDD14" }), _jsx("button", { className: "text-xl", children: "\u2753" }), _jsx("div", { className: "w-8 h-8 bg-slate-300 rounded-full overflow-hidden flex items-center justify-center font-bold text-slate-700", children: userName.charAt(0).toUpperCase() })] })] }), _jsx("main", { className: "flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar", children: children })] })] }));
}
function MenuLink({ to, icon, label, isActive }) {
    return (_jsxs(Link, { to: to, className: `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition ${isActive
            ? 'bg-blue-50 text-blue-900 font-semibold'
            : 'text-slate-600 hover:bg-slate-50'}`, children: [_jsx("span", { children: icon }), " ", label] }));
}
