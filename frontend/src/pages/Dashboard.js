import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_RT01, COLLECTION_ID_RT02, COLLECTION_ID_RT03 } from '../services/appwriteConfig';
import { Query } from 'appwrite';
export default function Dashboard() {
    const [dataRT01, setDataRT01] = useState([]);
    const [dataRT02, setDataRT02] = useState([]);
    const [dataRT03, setDataRT03] = useState([]);
    const [loading, setLoading] = useState(true);
    const months = ['November', 'Desember', 'Januari', 'Febuari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'];
    const targetPerCell = 10000; // Asumsi iuran Rp 10.000 per bulan per warga
    useEffect(() => {
        fetchAllData();
    }, []);
    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [resRT01, resRT02, resRT03] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT01, [Query.limit(100)]),
                databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT02, [Query.limit(100)]),
                databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT03, [Query.limit(100)])
            ]);
            setDataRT01(resRT01.documents);
            setDataRT02(resRT02.documents);
            setDataRT03(resRT03.documents);
        }
        catch (error) {
            console.error("Gagal mengambil data Dashboard:", error);
        }
        finally {
            setLoading(false);
        }
    };
    // --- FUNGSI PERHITUNGAN TOTAL ---
    const hitungTotal = (data) => {
        return data.reduce((acc, curr) => {
            const sumRow = months.reduce((mAcc, month) => mAcc + (Number(curr[month]) || 0), 0);
            return acc + sumRow;
        }, 0);
    };
    const totalRT01 = hitungTotal(dataRT01);
    const totalRT02 = hitungTotal(dataRT02);
    const totalRT03 = hitungTotal(dataRT03);
    const totalUangGlobal = totalRT01 + totalRT02 + totalRT03;
    const totalWargaGlobal = dataRT01.length + dataRT02.length + dataRT03.length;
    const totalTargetGlobal = totalWargaGlobal * months.length * targetPerCell;
    const pendingGlobal = Math.max(0, totalTargetGlobal - totalUangGlobal);
    const alokasi75 = totalUangGlobal * 0.75;
    const alokasi25 = totalUangGlobal * 0.25;
    const collectionRateGlobal = totalTargetGlobal > 0 ? ((totalUangGlobal / totalTargetGlobal) * 100).toFixed(1) : '0';
    // --- PERHITUNGAN COLLECTION RATE TIAP RT ---
    const targetRT01 = dataRT01.length * months.length * targetPerCell;
    const targetRT02 = dataRT02.length * months.length * targetPerCell;
    const targetRT03 = dataRT03.length * months.length * targetPerCell;
    const rateRT01 = targetRT01 > 0 ? ((totalRT01 / targetRT01) * 100).toFixed(1) : '0';
    const rateRT02 = targetRT02 > 0 ? ((totalRT02 / targetRT02) * 100).toFixed(1) : '0';
    const rateRT03 = targetRT03 > 0 ? ((totalRT03 / targetRT03) * 100).toFixed(1) : '0';
    return (_jsxs(PageLayout, { activeMenu: "dashboard", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-3xl font-bold text-blue-900", children: "Grand Dashboard Overview" }), _jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Ringkasan total iuran dari seluruh Rukun Tetangga (RT 01, RT 02, RT 03)." })] }), loading ? (_jsx("div", { className: "flex justify-center items-center h-40 bg-white rounded-xl border border-slate-200", children: _jsx("p", { className: "text-slate-500 font-medium animate-pulse", children: "Menyiapkan data dari semua RT..." }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsxs("div", { className: "bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-2xl shadow-lg text-white", children: [_jsx("p", { className: "text-blue-200 text-xs font-bold uppercase tracking-wider mb-2", children: "Total Kas Terkumpul" }), _jsxs("h3", { className: "text-4xl font-bold mb-4", children: ["Rp ", totalUangGlobal.toLocaleString('id-ID')] }), _jsx("div", { className: "space-y-2 pt-4 border-t border-blue-700/50 text-sm", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-blue-200", children: "Total Warga Aktif:" }), _jsxs("span", { className: "font-semibold", children: [totalWargaGlobal, " KK"] })] }) })] }), _jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-200", children: [_jsx("p", { className: "text-slate-500 text-xs font-bold uppercase tracking-wider mb-2", children: "Alokasi Dana Kas" }), _jsxs("div", { className: "space-y-4 mt-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "font-semibold text-slate-700", children: "Dana Pembangunan (75%)" }), _jsxs("span", { className: "font-bold text-blue-700", children: ["Rp ", alokasi75.toLocaleString('id-ID')] })] }), _jsx("div", { className: "w-full bg-slate-100 h-2 rounded-full overflow-hidden", children: _jsx("div", { className: "bg-blue-600 h-full rounded-full", style: { width: '75%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "font-semibold text-slate-700", children: "Dana Darurat (25%)" }), _jsxs("span", { className: "font-bold text-emerald-600", children: ["Rp ", alokasi25.toLocaleString('id-ID')] })] }), _jsx("div", { className: "w-full bg-slate-100 h-2 rounded-full overflow-hidden", children: _jsx("div", { className: "bg-emerald-500 h-full rounded-full", style: { width: '25%' } }) })] })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-200", children: [_jsx("p", { className: "text-slate-500 text-xs font-bold uppercase tracking-wider mb-2", children: "Status Pending & Target" }), _jsxs("h3", { className: "text-3xl font-bold text-slate-800 mb-1", children: ["Rp ", pendingGlobal.toLocaleString('id-ID')] }), _jsx("p", { className: "text-sm text-red-500 font-medium mb-4", children: "Kekurangan dari target ideal" }), _jsxs("div", { className: "pt-4 border-t border-slate-100", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "font-semibold text-slate-600", children: "Collection Rate Global" }), _jsxs("span", { className: "font-bold text-slate-800", children: [collectionRateGlobal, "%"] })] }), _jsx("div", { className: "w-full bg-slate-100 h-2 rounded-full overflow-hidden", children: _jsx("div", { className: "bg-orange-500 h-full rounded-full transition-all", style: { width: `${Math.min(Number(collectionRateGlobal), 100)}%` } }) })] })] })] }), _jsx("h3", { className: "text-xl font-bold text-slate-800 mb-4", children: "Rincian Per Rukun Tetangga (RT)" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h4", { className: "font-bold text-lg text-slate-800", children: "RT 01" }), _jsxs("span", { className: "bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full", children: [dataRT01.length, " Warga"] })] }), _jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wider mb-1", children: "Terkumpul" }), _jsxs("p", { className: "text-2xl font-bold text-blue-900 mb-3", children: ["Rp ", totalRT01.toLocaleString('id-ID')] }), _jsxs("div", { className: "pt-3 border-t border-slate-100 flex justify-between items-center text-xs", children: [_jsx("span", { className: "text-slate-500 font-medium", children: "Collection Rate:" }), _jsxs("span", { className: "font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded", children: [rateRT01, "%"] })] })] }), _jsxs("div", { className: "bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h4", { className: "font-bold text-lg text-slate-800", children: "RT 02" }), _jsxs("span", { className: "bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full", children: [dataRT02.length, " Warga"] })] }), _jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wider mb-1", children: "Terkumpul" }), _jsxs("p", { className: "text-2xl font-bold text-emerald-700 mb-3", children: ["Rp ", totalRT02.toLocaleString('id-ID')] }), _jsxs("div", { className: "pt-3 border-t border-slate-100 flex justify-between items-center text-xs", children: [_jsx("span", { className: "text-slate-500 font-medium", children: "Collection Rate:" }), _jsxs("span", { className: "font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded", children: [rateRT02, "%"] })] })] }), _jsxs("div", { className: "bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h4", { className: "font-bold text-lg text-slate-800", children: "RT 03" }), _jsxs("span", { className: "bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full", children: [dataRT03.length, " Warga"] })] }), _jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wider mb-1", children: "Terkumpul" }), _jsxs("p", { className: "text-2xl font-bold text-orange-600 mb-3", children: ["Rp ", totalRT03.toLocaleString('id-ID')] }), _jsxs("div", { className: "pt-3 border-t border-slate-100 flex justify-between items-center text-xs", children: [_jsx("span", { className: "text-slate-500 font-medium", children: "Collection Rate:" }), _jsxs("span", { className: "font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded", children: [rateRT03, "%"] })] })] })] })] }))] }));
}
