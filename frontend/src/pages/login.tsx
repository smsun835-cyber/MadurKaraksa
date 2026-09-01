import React, { useState } from 'react';
import { account } from '../services/appwriteConfig';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // State baru untuk menampilkan/menyembunyikan password
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      // Coba buat sesi baru
      await account.createEmailPasswordSession(email, password);
      alert('Login berhasil!');
      navigate('/');
    } catch (error: any) {
      // Jika error karena sesi aktif, langsung arahkan saja ke halaman utama
      if (error.code === 401 && error.message.includes('prohibited')) {
        navigate('/');
      } else {
        setErrorMsg(error.message || 'Gagal login, periksa kembali email dan password.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Login Sistem RT/RW</h2>
        <p className="text-slate-500 text-sm mb-6">Silakan masuk sesuai dengan akun dan hak akses Anda.</p>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
            {/* WADAH RELATIVE AGAR ICON BISA MENEMPEL DI KANAN DALAM INPUT */}
            <div className="relative">
              <input 
                // Tipe input berubah otomatis berdasarkan state
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Tambahan pr-10 agar teks yang diketik tidak menabrak ikon mata
                className="w-full border border-slate-300 rounded-lg p-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
              
              {/* TOMBOL ICON MATA */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-900 transition-colors"
              >
                {showPassword ? (
                  // Ikon Mata Terbuka
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  // Ikon Mata Tertutup (Dicoret)
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-blue-900 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-blue-800 transition">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}