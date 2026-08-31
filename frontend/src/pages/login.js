import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { account } from '../services/appwrite';
import { useNavigate } from 'react-router-dom';
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            // Coba buat sesi baru
            await account.createEmailPasswordSession(email, password);
            alert('Login berhasil!');
            navigate('/');
        }
        catch (error) {
            // Jika error karena sesi aktif, langsung arahkan saja ke halaman utama
            if (error.code === 401 && error.message.includes('prohibited')) {
                navigate('/');
            }
            else {
                setErrorMsg(error.message || 'Gagal login, periksa kembali email dan password.');
            }
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-slate-100", children: _jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold text-blue-900 mb-2", children: "Login Sistem RT/RW" }), _jsx("p", { className: "text-slate-500 text-sm mb-6", children: "Silakan masuk sesuai dengan akun dan hak akses Anda." }), errorMsg && (_jsx("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg", children: errorMsg })), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 uppercase mb-1", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 uppercase mb-1", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100", required: true })] }), _jsx("button", { type: "submit", className: "w-full bg-blue-900 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-blue-800 transition", children: "Masuk" })] })] }) }));
}
