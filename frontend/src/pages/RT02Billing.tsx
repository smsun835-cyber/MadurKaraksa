import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_RT02, getUserRole } from '../services/appwriteConfig';
import { Query, ID } from 'appwrite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export default function RT02Billing() {
  const [residents, setResidents] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('warga');

  const [namaWarga, setNamaWarga] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [bulanPilih, setBulanPilih] = useState('November');
  const [nominal, setNominal] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);

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
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT02, [Query.limit(100)]);
      setResidents(response.documents as unknown as BillingRecord[]);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text("Laporan Iuran Warga - RT 02", 14, 20);
  
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 27);
  
      const tableColumn = ["Nama Warga", "Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu"];
      const tableRows = residents.map(item => [
        item.Nama,
        (item.November || 0).toLocaleString('id-ID'),
        (item.Desember || 0).toLocaleString('id-ID'),
        (item.Januari || 0).toLocaleString('id-ID'),
        (item.Febuari || 0).toLocaleString('id-ID'),
        (item.Maret || 0).toLocaleString('id-ID'),
        (item.April || 0).toLocaleString('id-ID'),
        (item.Mei || 0).toLocaleString('id-ID'),
        (item.Juni || 0).toLocaleString('id-ID'),
        (item.Juli || 0).toLocaleString('id-ID'),
        (item.Agustus || 0).toLocaleString('id-ID')
      ]);
  
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138] },
      });
  
      doc.save("Laporan_Iuran_RT_02.pdf");
    };

  const daftarNamaUnik = Array.from(new Set(residents.map((r) => r.Nama).filter(Boolean)));
  const filteredNama = daftarNamaUnik.filter(nama => nama.toLowerCase().includes(namaWarga.toLowerCase()));

 const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaWarga.trim()) return alert("Silakan isi atau pilih nama warga!");

    try {
      if (isEditing) {
        // Mode Edit dari tombol "Edit" di tabel
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT02, isEditing, {
          Nama: namaWarga,
          [bulanPilih]: Number(nominal),
        });
        alert(`Data ${namaWarga} berhasil diubah!`);
      } else {
        // Mode Input Baru: Cek apakah nama warga sudah ada di database
        const existingResident = residents.find(
          (r) => r.Nama.toLowerCase() === namaWarga.toLowerCase().trim()
        );

        if (existingResident) {
          // JIKA NAMA SUDAH ADA: Update baris yang lama (tambahkan nominal di bulan yang dipilih)
          await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT02, existingResident.$id, {
            [bulanPilih]: Number(nominal),
          });
          alert(`Data iuran bulan ${bulanPilih} berhasil ditambahkan ke baris milik ${namaWarga}!`);
        } else {
          // JIKA NAMA BELUM ADA: Buat baris baru
          await databases.createDocument(DATABASE_ID, COLLECTION_ID_RT02, ID.unique(), {
            Nama: namaWarga,
            [bulanPilih]: Number(nominal),
          });
          alert(`Warga baru ${namaWarga} berhasil ditambahkan!`);
        }
      }
      
      // Bersihkan form setelah selesai
      setIsEditing(null);
      setNamaWarga('');
      setNominal('');
      fetchData(); 
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    }
  };

  const handleEdit = (item: BillingRecord) => {
    setIsEditing(item.$id);
    setNamaWarga(item.Nama);
    setIsDropdownOpen(false);
    setNominal(String(item[bulanPilih as keyof BillingRecord] || 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setNamaWarga('');
    setNominal('');
    setIsDropdownOpen(false);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`YAKIN HAPUS? Seluruh record data milik ${nama} pada baris ini akan dihapus permanen.`)) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_RT02, id);
        alert(`Data ${nama} berhasil dihapus.`);
        if (isEditing === id) handleCancelEdit();
        fetchData();
      } catch (error) {
        console.error("Gagal menghapus:", error);
        alert("Terjadi kesalahan saat menghapus data.");
      }
    }
  };

  const months = ['November', 'Desember', 'Januari', 'Febuari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'] as const;
  const totalCollected = residents.reduce((acc, curr) => {
    const sumRow = months.reduce((mAcc, month) => mAcc + (Number(curr[month]) || 0), 0);
    return acc + sumRow;
  }, 0);
  const targetPerCell = 10000;
  const totalTargetCell = residents.length * months.length * targetPerCell;
  const pendingDues = Math.max(0, totalTargetCell - totalCollected);
  const amount75 = totalCollected * 0.75;
  const amount25 = totalCollected * 0.25;
  const collectionRate = totalTargetCell > 0 ? ((totalCollected / totalTargetCell) * 100).toFixed(1) : '0';

  return (
    <PageLayout activeMenu="rt02">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">RT 02 Financial Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Manage monthly dues and payment records for residents of RT 02.</p>
        </div>
        <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium border border-slate-200">
          Status Akses: <span className="font-bold uppercase text-blue-800">{userRole}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Collected</p>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Rp {totalCollected.toLocaleString('id-ID')}</h3>
          <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
            <div className="flex justify-between"><span>Alokasi 75%:</span><span className="font-semibold text-blue-900">Rp {amount75.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span>Alokasi 25%:</span><span className="font-semibold text-emerald-700">Rp {amount25.toLocaleString('id-ID')}</span></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Dues</p>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">Rp {pendingDues.toLocaleString('id-ID')}</h3>
          <p className="text-xs font-medium text-red-500">{residents.length} Terdaftar ({months.length} Bulan Periode)</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Collection Rate</p>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">{collectionRate}%</h3>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-800 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(Number(collectionRate), 100)}%` }}></div>
          </div>
        </div>
      </div>

      {userRole !== 'warga' && (
        <div className={`p-6 rounded-xl border shadow-sm mb-6 ${isEditing ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800">
              {isEditing ? '✏️ Edit Record Iuran' : 'Input Data Iuran Baru'}
            </h3>
            {isEditing && (
              <button type="button" onClick={handleCancelEdit} className="text-sm bg-white border border-slate-300 px-3 py-1 rounded text-slate-600 hover:text-red-500 font-medium">
                X Batal Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSaveRecord} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start relative">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nama Warga</label>
              <input 
                type="text"
                placeholder="Cari atau ketik nama..."
                value={namaWarga}
                onChange={(e) => { setNamaWarga(e.target.value); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} 
                disabled={!!isEditing} 
                className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${isEditing ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300'}`}
                required
              />
              {isDropdownOpen && !isEditing && (
                <ul className="absolute z-10 w-full bg-white border border-slate-200 shadow-xl max-h-48 overflow-y-auto rounded-lg mt-1">
                  {filteredNama.length > 0 ? (
                    filteredNama.map((nama, index) => (
                      <li 
                        key={index} 
                        // UBAH onClick MENJADI onMouseDown DI SINI:
                        onMouseDown={() => { setNamaWarga(nama); setIsDropdownOpen(false); }} 
                        className="p-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-50 transition"
                      >
                        {nama}
                      </li>
                    ))
                  ) : (
                    <li className="p-2.5 text-sm text-slate-500 italic">Nama belum ada di DB</li>
                  )}
                  {namaWarga.trim() !== '' && !daftarNamaUnik.includes(namaWarga) && (
                    <li 
                      // UBAH onClick MENJADI onMouseDown DI SINI:
                      onMouseDown={() => setIsDropdownOpen(false)} 
                      className="p-2.5 text-sm bg-blue-50 text-blue-800 font-semibold cursor-pointer sticky bottom-0 border-t border-blue-100"
                    >
                      + Jadikan "{namaWarga}" warga baru
                    </li>
                  )}
                </ul>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Bulan</label>
              <select 
                value={bulanPilih}
                onChange={(e) => {
                  const bulan = e.target.value;
                  setBulanPilih(bulan);
                  if (isEditing) {
                    const currentResident = residents.find(r => r.$id === isEditing);
                    if (currentResident) setNominal(String(currentResident[bulan as keyof BillingRecord] || 0));
                  }
                }}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-100 h-[42px]"
              >
                <option value="November">November</option>
                <option value="Desember">Desember</option>
                <option value="Januari">Januari</option>
                <option value="Febuari">Februari</option>
                <option value="Maret">Maret</option>
                <option value="April">April</option>
                <option value="Mei">Mei</option>
                <option value="Juni">Juni</option>
                <option value="Juli">Juli</option>
                <option value="Agustus">Agustus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nominal (Rp)</label>
              <input 
                type="number" 
                placeholder="10000" 
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 h-[42px]"
                required
              />
            </div>
            <div className="h-full flex items-end">
              <button type="submit" className={`w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm transition h-[42px] ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-900 hover:bg-blue-800'}`}>
                {isEditing ? '💾 Update Record' : '💾 Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">

         {/* ===== INI ADALAH BAGIAN HEADER TABEL YANG BERISI TOMBOL ===== */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-lg text-slate-800">Tabel Iuran Warga RT 02</h3>

          <button 
            type="button"
            onClick={handleDownloadPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            📥 DOWNLOAD Laporan PDF
          </button>
        </div>

        {/* ============================================================= */}
        <div className="w-full overflow-auto max-h-[65vh] border-t border-slate-200">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
  <tr className="text-xs text-slate-500 uppercase tracking-wider">
    <th className="py-3 px-4 font-semibold sticky top-0 left-0 z-20 bg-slate-100 text-sm text-slate-600 border-b border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
       Nama Warga
    </th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">November</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Desember</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Januari</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Febuari</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Maret</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">April</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Mei</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Juni</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Juli</th>
        <th className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">Agustus</th>
                {userRole !== 'warga' && (
                  <th className="p-4 font-semibold text-center bg-slate-100 border-l border-slate-200">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={12} className="p-6 text-center text-slate-400">Memuat data dari database...</td></tr>
              ) : residents.length === 0 ? (
                <tr><td colSpan={12} className="p-6 text-center text-slate-400">Belum ada data tersimpan.</td></tr>
              ) : (
                residents.map((item) => (
                  <tr key={item.$id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${isEditing === item.$id ? 'bg-orange-50' : ''}`}>
                    <td className="p-4 font-medium text-slate-800 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                     {item.Nama}
                    </td>
                    <td className="p-4 text-center">{item.November?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Desember?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Januari?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Febuari?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Maret?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.April?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Mei?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Juni?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Juli?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">{item.Agustus?.toLocaleString('id-ID') || 0}</td>
                    
                    {userRole !== 'warga' && (
                      <td className="p-4 text-center bg-slate-50 border-l border-slate-100">
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" onClick={() => handleEdit(item)} className="px-3 py-1 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 font-semibold transition text-xs">Edit</button>
                          {userRole === 'admin' && (
                            <button type="button" onClick={() => handleDelete(item.$id, item.Nama)} className="px-3 py-1 bg-red-600 text-white rounded shadow-sm hover:bg-red-700 font-semibold transition text-xs">Hapus</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}