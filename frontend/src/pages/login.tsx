import React, { useState } from 'react';
import { account } from '../services/appwrite';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-900 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-blue-800 transition">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}