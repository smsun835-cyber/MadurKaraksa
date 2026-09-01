import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { account, getUserRole } from '../../services/appwriteConfig';

interface PageLayoutProps {
  children: React.ReactNode;
  activeMenu: string;
}

export default function PageLayout({ children, activeMenu }: PageLayoutProps) {
  const [userRole, setUserRole] = useState<string>('warga');
  const [userName, setUserName] = useState<string>('Pengunjung');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // State untuk toggle sidebar di HP
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
      } catch (err) {
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
    } catch (error) {
      console.error('Gagal logout:', error);
      alert('Terjadi kesalahan saat logout.');
    }
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-800 h-screen overflow-hidden flex relative">
      
      {/* OVERLAY GELAP DI HP KETIKA SIDEBAR DIBUKA */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR RESPONSIF */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col h-full justify-between transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          <div className="p-6 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-blue-900 leading-tight">
                Madur Raksa<br />
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-800 text-white rounded flex items-center justify-center font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">{userName}</p>
                  <p className="text-xs text-slate-500 uppercase">Role: {userRole}</p>
                </div>
              </div>
            </div>
            {/* Tombol Close (X) khusus untuk menutup sidebar di HP */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-500 hover:text-slate-800 text-xl font-bold p-1"
            >
              ✕
            </button>
          </div>

          <nav className="px-4 space-y-1 overflow-y-auto" onClick={() => setIsSidebarOpen(false)}>
            <MenuLink to="/" icon="📊" label="Dashboard" isActive={activeMenu === 'dashboard'} />
            <MenuLink to="/rt-01" icon="💵" label="RT 01 Billing" isActive={activeMenu === 'rt01'} />
            <MenuLink to="/rt-02" icon="💵" label="RT 02 Billing" isActive={activeMenu === 'rt02'} />
            <MenuLink to="/rt-03" icon="💵" label="RT 03 Billing" isActive={activeMenu === 'rt03'} />

            {/* HANYA MUNCUL UNTUK ROLE BENDAHARA ATAU ADMIN */}
            {(userRole === 'bendahara' || userRole === 'admin') && (
              <MenuLink 
                to="/laporan-kegiatan" 
                icon="📋" 
                label="Laporan Kegiatan" 
                isActive={activeMenu === 'kegiatan'} 
              />
            )}
          </nav>
        </div>

        {/* BAGIAN BAWAH SIDEBAR: DINAMIS ANTARA LOGIN ATAU LOGOUT */}
        <div className="p-4 border-t border-slate-100">
          {userRole !== 'warga' ? (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 transition"
            >
              <span>🚪</span> Logout
            </button>
          ) : (
            <Link 
              to="/login" 
              className="block text-center bg-blue-50 text-blue-900 border border-blue-200 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-blue-100 transition shadow-sm"
            >
              🔐 Login Admin / Barudak
            </Link>
          )}
        </div>
      </aside>
        
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="bg-white h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {/* TOMBOL HAMBURGER UNTUK MEMBUKA SIDEBAR DI HP */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 text-2xl focus:outline-none p-1 rounded hover:bg-slate-100"
            >
              ☰
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block relative">
              <input 
                type="text" 
                placeholder="Search records..." 
                className="bg-white border border-slate-300 rounded-lg py-1.5 px-4 text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <button className="text-xl">🔔</button>
            <button className="text-xl">❓</button>
            <div className="w-8 h-8 bg-slate-300 rounded-full overflow-hidden flex items-center justify-center font-bold text-slate-700">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

function MenuLink({ to, icon, label, isActive }: { to: string, icon: string, label: string, isActive: boolean }) {
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition ${
      isActive 
        ? 'bg-blue-50 text-blue-900 font-semibold' 
        : 'text-slate-600 hover:bg-slate-50'
    }`}>
      <span>{icon}</span> {label}
    </Link>
  );
}