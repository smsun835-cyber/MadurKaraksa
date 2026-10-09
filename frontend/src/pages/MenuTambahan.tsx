import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_TAMBAHAN, getUserRole } from '../services/appwriteConfig';
import { Query, ID } from 'appwrite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TambahanRecord {
  $id: string;
  $updatedAt: string;
  ID_warga: string;
  Nama: string;
  RT: string;
  September: number;
  Oktober: number;
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

export default function MenuTambahan() {
  const [records, setRecords] = useState<TambahanRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('warga');

  // State Form Input
  const [namaWarga, setNamaWarga] = useState('');
  const [asalRT, setAsalRT] = useState(''); // Bebas diisi RT atau "Luar Lingkungan"
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [nominal, setNominal] = useState(''); 
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Mengurutkan bulan dari September s/d Agustus sesuai permintaan
  const months = ['September', 'Oktober', 'November', 'Desember', 'Januari', 'Febuari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'] as const;

  useEffect(() => {
    async function init() {
      const role = await getUserRole();
      setUserRole(role);
      fetchData();
    }
    init();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_TAMBAHAN, [Query.limit(500)]);
      setRecords(response.documents as unknown as TambahanRecord[]);
    } catch (error) {
      console.error("Gagal mengambil data tambahan:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- MENGHITUNG TOTAL KESELURUHAN (GRAND TOTAL) ---
  const grandTotal = records.reduce((acc, curr) => {
    const sumRow = months.reduce((mAcc, month) => mAcc + (Number(curr[month as keyof TambahanRecord]) || 0), 0);
    return acc + sumRow;
  }, 0);

  // --- FUNGSI SIMPAN & UPDATE MANUAL DONATUR ---
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaWarga.trim()) return alert("Nama donatur/warga wajib diisi!");
    if (!asalRT.trim()) return alert("Asal donatur wajib diisi (misal: RT 01 atau Luar Lingkungan)!");
    if (selectedMonths.length === 0) return alert("Pilih minimal 1 bulan!");
    if (!nominal) return alert("Masukkan nominal!");

    try {
      const numericNominal = Number(nominal);
      const updatePayload: Record<string, number> = {};
      selectedMonths.forEach(m => {
        updatePayload[m] = numericNominal;
      });

      if (isEditing) {
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID_TAMBAHAN, isEditing, {
          Nama: namaWarga,
          RT: asalRT,
          ...updatePayload
        });
        alert(`Data donatur ${namaWarga} berhasil diperbarui!`);
      } else {
        // Cek apakah donatur ini sudah ada di tabel berdasarkan Nama & Asal
        const existingRecord = records.find(
          (r) => r.Nama.toLowerCase() === namaWarga.toLowerCase().trim() && r.RT.toLowerCase() === asalRT.toLowerCase().trim()
        );

        if (existingRecord) {
          await databases.updateDocument(DATABASE_ID, COLLECTION_ID_TAMBAHAN, existingRecord.$id, updatePayload);
          alert(`Berhasil menambahkan donasi bulan baru untuk ${namaWarga}!`);
        } else {
          // Buat Data Baru
          await databases.createDocument(DATABASE_ID, COLLECTION_ID_TAMBAHAN, ID.unique(), {
            ID_warga: `EXT-${Date.now()}`, // ID Unik khusus donatur eksternal
            Nama: namaWarga,
            RT: asalRT,
            ...updatePayload
          });
          alert(`Donatur baru ${namaWarga} berhasil dicatat!`);
        }
      }

      // Reset Form
      handleCancelEdit();
      fetchData(); 
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    }
  };

  const handleEdit = (item: TambahanRecord) => {
    setIsEditing(item.$id);
    setNamaWarga(item.Nama);
    setAsalRT(item.RT);
    setSelectedMonths([]);
    setNominal('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setNamaWarga('');
    setAsalRT('');
    setSelectedMonths([]);
    setNominal('');
  };

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin hapus data donasi milik ${nama}?`)) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_TAMBAHAN, id);
        fetchData();
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape'); // Pakai landscape karena kolomnya banyak
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text("Laporan Iuran Tambahan & Donasi Eksternal", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Total Terkumpul: Rp ${grandTotal.toLocaleString('id-ID')}`, 14, 27);

    const tableColumn = ["Nama Donatur/Warga", "Asal", "Sep", "Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "TOTAL (Rp)"];
    
    const tableRows = records.map(item => {
      const rowTotal = months.reduce((acc, m) => acc + (Number(item[m as keyof TambahanRecord]) || 0), 0);
      return [
        item.Nama,
        item.RT,
        (item.September || 0).toLocaleString('id-ID'),
        (item.Oktober || 0).toLocaleString('id-ID'),
        (item.November || 0).toLocaleString('id-ID'),
        (item.Desember || 0).toLocaleString('id-ID'),
        (item.Januari || 0).toLocaleString('id-ID'),
        (item.Febuari || 0).toLocaleString('id-ID'),
        (item.Maret || 0).toLocaleString('id-ID'),
        (item.April || 0).toLocaleString('id-ID'),
        (item.Mei || 0).toLocaleString('id-ID'),
        (item.Juni || 0).toLocaleString('id-ID'),
        (item.Juli || 0).toLocaleString('id-ID'),
        (item.Agustus || 0).toLocaleString('id-ID'),
        rowTotal.toLocaleString('id-ID')
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save("Laporan_Iuran_Tambahan.pdf");
  };

  return (
    <PageLayout activeMenu="tambahan">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Data Iuran Tambahan & Donatur</h2>
          <p className="text-slate-500 text-sm mt-1">Rekapitulasi sisa uang iuran warga dan donasi dari luar lingkungan.</p>
        </div>
      </div>

      {/* --- CARD TOTAL KESELURUHAN --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pemasukan Tambahan</p>
          <h3 className="text-3xl font-bold text-blue-700">Rp {grandTotal.toLocaleString('id-ID')}</h3>
          <p className="text-xs text-slate-400 mt-2">Akumulasi dari seluruh RT dan Donatur Eksternal</p>
        </div>
      </div>

      {/* --- FORM INPUT UNTUK DONATUR LUAR/MANUAL (KHUSUS PENGURUS) --- */}
      {userRole !== 'warga' && (
        <div className={`p-6 rounded-xl border shadow-sm mb-6 ${isEditing ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800">
              {isEditing ? '✏️ Edit Data Tambahan' : 'Input Donatur (Manual / Luar Lingkungan)'}
            </h3>
            {isEditing && (
              <button type="button" onClick={handleCancelEdit} className="text-sm bg-white border border-slate-300 px-3 py-1 rounded text-slate-600 hover:text-red-500 font-medium">
                X Batal Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSaveRecord} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nama Donatur / Warga</label>
                <input 
                  type="text"
                  placeholder="Contoh: Hamba Allah, Pa Rahmat..."
                  value={namaWarga}
                  onChange={(e) => setNamaWarga(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Asal / Instansi</label>
                <input 
                  type="text"
                  placeholder="Contoh: Luar Lingkungan, RT 01..."
                  value={asalRT}
                  onChange={(e) => setAsalRT(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  placeholder="15000" 
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase">Pilih Bulan</label>
                <div className="space-x-2">
                  <button type="button" onClick={() => setSelectedMonths([...months])} className="text-[11px] text-blue-600 hover:underline font-semibold">Pilih Semua</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => setSelectedMonths([])} className="text-[11px] text-red-500 hover:underline font-semibold">Reset Pilihan</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {months.map((m) => {
                  const isChecked = selectedMonths.includes(m);
                  return (
                    <label key={m} className={`flex items-center gap-2.5 p-2 rounded border text-xs cursor-pointer transition ${isChecked ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                      <input type="checkbox" checked={isChecked} onChange={(e) => { e.target.checked ? setSelectedMonths([...selectedMonths, m]) : setSelectedMonths(selectedMonths.filter(item => item !== m)) }} className="rounded border-slate-300 text-blue-900 focus:ring-blue-100 w-4 h-4 cursor-pointer" />
                      {m}
                    </label>
                  );
                })}
              </div>
            </div>

            <button type="submit" className={`w-full text-white font-medium py-3 px-4 rounded-lg text-sm transition ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-900 hover:bg-blue-800'}`}>
              {isEditing ? '💾 Update Data Tambahan' : `💾 Simpan Donasi (${selectedMonths.length} Bulan)`}
            </button>
          </form>
        </div>
      )}

      {/* --- TABEL DATA --- */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-10">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">Tabel Lebihan Kas & Donatur</h3>
          <button onClick={handleDownloadPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2">
            📥 DOWNLOAD PDF
          </button>
        </div>

        <div className="w-full overflow-auto max-h-[75vh]">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-4 font-semibold sticky left-0 z-20 bg-slate-100 text-sm text-slate-600 border-b border-slate-200">NAMA DONATUR</th>
                <th className="py-3 px-4 font-semibold text-sm text-center text-slate-600 border-b border-slate-200 bg-slate-50 border-r">ASAL</th>
                {months.map(m => (
                  <th key={m} className="py-3 px-3 font-semibold text-[11px] text-center text-slate-600 border-b border-slate-200">{m.substring(0,3).toUpperCase()}</th>
                ))}
                <th className="py-3 px-4 font-bold text-sm text-right text-emerald-700 border-b border-slate-200 bg-emerald-50 border-l">TOTAL PER WARGA</th>
                {userRole !== 'warga' && <th className="py-3 px-4 font-semibold text-center text-slate-600 border-b border-slate-200">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && <tr><td colSpan={17} className="p-6 text-center text-slate-500">Memuat data...</td></tr>}
              {!loading && records.length === 0 && (
                <tr><td colSpan={17} className="p-6 text-center text-slate-500 italic">Belum ada donasi atau uang tambahan.</td></tr>
              )}
              {records.map((item) => {
                // MENGHITUNG TOTAL PER BARIS (PER WARGA)
                const rowTotal = months.reduce((acc, m) => acc + (Number(item[m as keyof TambahanRecord]) || 0), 0);

                return (
                  <tr key={item.$id} className="border-b border-slate-100 hover:bg-blue-50">
                    <td className="p-4 font-bold text-slate-800 sticky left-0 bg-white shadow-[1px_0_0_0_#e2e8f0]">
                      {item.Nama}
                    </td>
                    <td className="p-4 text-center font-semibold text-blue-700 bg-blue-50/30 border-r border-slate-100">
                      {item.RT}
                    </td>
                    
                    {months.map((bulan) => {
                      const uangLebih = Number(item[bulan as keyof TambahanRecord]) || 0;
                      return (
                        <td key={bulan} className="p-4 text-center border-r border-slate-50 text-xs">
                          {uangLebih > 0 ? (
                            <span className="text-emerald-600 font-bold">+{uangLebih.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-4 text-right font-bold text-emerald-700 bg-emerald-50/50 border-l border-emerald-100">
                      Rp {rowTotal.toLocaleString('id-ID')}
                    </td>

                    {userRole !== 'warga' && (
                      <td className="p-4 text-center bg-slate-50 border-l border-slate-100">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEdit(item)} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition">Edit</button>
                          {userRole === 'admin' && (
                            <button onClick={() => handleDelete(item.$id, item.Nama)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold transition">Hapus</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}