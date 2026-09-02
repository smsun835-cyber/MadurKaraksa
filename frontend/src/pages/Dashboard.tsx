import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_RT01, COLLECTION_ID_RT02, COLLECTION_ID_RT03, getUserRole } from '../services/appwriteConfig';
import { Query } from 'appwrite';

interface BillingRecord {
  $id: string;
  Nama: string;
  November: number;
  Desember: number;
  Januari: number;
  Febuari: number;
  Maret: number;
  April: number;
  Mei: number;
  Juni: number;
  Juli: number;
  Agustus: number;
}

export default function Dashboard() {
  const [dataRT01, setDataRT01] = useState<BillingRecord[]>([]);
  const [dataRT02, setDataRT02] = useState<BillingRecord[]>([]);
  const [dataRT03, setDataRT03] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState(false);
  const [userRole, setUserRole] = useState('warga'); // Jangan lupa import getUserRole dari appwr

  const months = ['November', 'Desember', 'Januari', 'Febuari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'] as const;
  const targetPerCell = 10000; // Asumsi iuran Rp 10.000 per bulan per warga

  useEffect(() => {
  async function init() {
    const role = await getUserRole();
    setUserRole(role);
    fetchAllData();
  }
  init();
}, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resRT01, resRT02, resRT03] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT01, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT02, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT03, [Query.limit(100)])
      ]);

      setDataRT01(resRT01.documents as unknown as BillingRecord[]);
      setDataRT02(resRT02.documents as unknown as BillingRecord[]);
      setDataRT03(resRT03.documents as unknown as BillingRecord[]);

    } catch (error) {
      console.error("Gagal mengambil data Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI PERHITUNGAN TOTAL ---
  const hitungTotal = (data: BillingRecord[]) => {
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

  // --- FUNGSI RESET DATA IURAN (KHUSUS ADMIN) ---
  const handleResetPeriode = async () => {
    // 1. Peringatan Pertama
    if (!window.confirm("⚠️ PERINGATAN BERBAHAYA!\n\nAnda yakin ingin mengosongkan SELURUH data iuran di RT 01, 02, dan 03? Nama warga akan dipertahankan, tapi semua nominal uang akan menjadi Rp 0.")) {
      return;
    }

    // 2. Konfirmasi Ganda (Ketik RESET) untuk mencegah kepencet
    const konfirmasi = window.prompt("Ketik kata 'RESET' (huruf besar semua) untuk melanjutkan:");
    if (konfirmasi !== 'RESET') {
      alert("Proses reset dibatalkan karena kata kunci salah atau dibatalkan.");
      return;
    }

    setIsResetting(true);
    try {
      // Data yang akan di-update (semua bulan dikembalikan ke 0)
      const resetPayload = {
        November: 0, Desember: 0, Januari: 0, Febuari: 0, Maret: 0, 
        April: 0, Mei: 0, Juni: 0, Juli: 0, Agustus: 0
      };

      const resetPromises: Promise<any>[] = [];

      // Kumpulkan semua perintah update dari RT 01
      dataRT01.forEach((warga) => {
        resetPromises.push(databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT01, warga.$id, resetPayload));
      });

      // Kumpulkan semua perintah update dari RT 02
      dataRT02.forEach((warga) => {
        resetPromises.push(databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT02, warga.$id, resetPayload));
      });

      // Kumpulkan semua perintah update dari RT 03
      dataRT03.forEach((warga) => {
        resetPromises.push(databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT03, warga.$id, resetPayload));
      });

      // Eksekusi semua perintah update sekaligus!
      await Promise.all(resetPromises);

      alert("✅ BERHASIL! Seluruh data iuran warga telah direset menjadi 0. Selamat datang di periode pembukuan baru!");
      
      // Ambil ulang data agar dashboard langsung menampilkan angka 0
      fetchAllData(); 

    } catch (error) {
      console.error("Gagal melakukan reset:", error);
      alert("Terjadi kesalahan saat mereset data.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <PageLayout activeMenu="dashboard">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-blue-900">Grand Dashboard Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Ringkasan total iuran dari seluruh Rukun Tetangga (RT 01, RT 02, RT 03).</p>
      </div>

      {/* TOMBOL RESET HANYA MUNCUL JIKA USER ADALAH ADMIN */}
      {userRole === 'admin' && (
        <button 
          onClick={handleResetPeriode}
          disabled={isResetting || loading}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition ${
            isResetting ? 'bg-slate-400 cursor-wait' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isResetting ? 'Sedang Mereset Data...' : '⚠️ Reset Periode Baru'}
        </button>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 font-medium animate-pulse">Menyiapkan data dari semua RT...</p>
        </div>
      ) : (
        <>
          {/* MASTER SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-2xl shadow-lg text-white">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Total Kas Terkumpul</p>
              <h3 className="text-4xl font-bold mb-4">Rp {totalUangGlobal.toLocaleString('id-ID')}</h3>
              <div className="space-y-2 pt-4 border-t border-blue-700/50 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">Total Warga Aktif:</span>
                  <span className="font-semibold">{totalWargaGlobal} KK</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Alokasi Dana Kas</p>
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">Dana Pembangunan (75%)</span>
                    <span className="font-bold text-blue-700">Rp {alokasi75.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">Dana Darurat (25%)</span>
                    <span className="font-bold text-emerald-600">Rp {alokasi25.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Status Pending & Target</p>
              <h3 className="text-3xl font-bold text-slate-800 mb-1">Rp {pendingGlobal.toLocaleString('id-ID')}</h3>
              <p className="text-sm text-red-500 font-medium mb-4">Kekurangan dari target ideal</p>
              
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-600">Collection Rate Global</span>
                  <span className="font-bold text-slate-800">{collectionRateGlobal}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${Math.min(Number(collectionRateGlobal), 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* BREAKDOWN PER RT (DENGAN TAMBAHAN COLLECTION RATE MASING-MASING) */}
          <h3 className="text-xl font-bold text-slate-800 mb-4">Rincian Per Rukun Tetangga (RT)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card RT 01 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-lg text-slate-800">RT 01</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{dataRT01.length} Warga</span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Terkumpul</p>
              <p className="text-2xl font-bold text-blue-900 mb-3">Rp {totalRT01.toLocaleString('id-ID')}</p>
              
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Collection Rate:</span>
                <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{rateRT01}%</span>
              </div>
            </div>

            {/* Card RT 02 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-lg text-slate-800">RT 02</h4>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">{dataRT02.length} Warga</span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Terkumpul</p>
              <p className="text-2xl font-bold text-emerald-700 mb-3">Rp {totalRT02.toLocaleString('id-ID')}</p>
              
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Collection Rate:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{rateRT02}%</span>
              </div>
            </div>

            {/* Card RT 03 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-lg text-slate-800">RT 03</h4>
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">{dataRT03.length} Warga</span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Terkumpul</p>
              <p className="text-2xl font-bold text-orange-600 mb-3">Rp {totalRT03.toLocaleString('id-ID')}</p>
              
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Collection Rate:</span>
                <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{rateRT03}%</span>
              </div>
            </div>

          </div>
        </>
      )}
    </PageLayout>
  );
}