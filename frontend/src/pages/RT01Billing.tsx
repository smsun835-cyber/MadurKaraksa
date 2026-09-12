import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_RT01, COLLECTION_ID_HISTORI, getUserRole } from '../services/appwriteConfig';
import { Query, ID } from 'appwrite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillingRecord {
  $id: string;
  $updatedAt: string;
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

interface InfoDetail {
  loading: boolean;
  nama: string;
  bulan: string;
  nominal: number;
  tanggalBayar: string;
  isLegacy?: boolean;
}

export default function RT01Billing() {
  const [residents, setResidents] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('warga');

  const [namaWarga, setNamaWarga] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // PERUBAHAN: Menggunakan Array untuk menampung banyak bulan sekaligus
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [nominal, setNominal] = useState('10000'); // Default standar iuran per bulan
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const [infoDetail, setInfoDetail] = useState<InfoDetail | null>(null);

  const months = ['November', 'Desember', 'Januari', 'Febuari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'] as const;

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
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT01, [Query.limit(100)]);
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
    doc.text("Laporan Iuran Warga - RT 01", 14, 20);

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

    doc.save("Laporan_Iuran_RT_01.pdf");
  };

  // --- FUNGSI SIMPAN DENGAN DUKUNGAN MULTI-BULAN SEKALIGUS ---
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaWarga.trim()) return alert("Silakan isi atau pilih nama warga!");
    if (selectedMonths.length === 0) return alert("Pilih minimal 1 bulan pembayaran!");
    if (!nominal) return alert("Masukkan nominal iuran!");

    try {
      let targetId = '';
      const numericNominal = Number(nominal);

      // Membuat objek payload dinamis untuk semua bulan yang dicentang
      // Contoh: { Januari: 10000, Februari: 10000 }
      const updatePayload: Record<string, number> = {};
      selectedMonths.forEach(m => {
        updatePayload[m] = numericNominal;
      });

      if (isEditing) {
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT01, isEditing, updatePayload);
        targetId = isEditing;
        alert(`Data iuran ${namaWarga} berhasil diperbarui!`);
      } else {
        const existingResident = residents.find(
          (r) => r.Nama.toLowerCase() === namaWarga.toLowerCase().trim()
        );

        if (existingResident) {
          await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT01, existingResident.$id, updatePayload);
          targetId = existingResident.$id;
          alert(`Berhasil menambahkan pembayaran untuk ${selectedMonths.length} bulan ke baris ${namaWarga}!`);
        } else {
          const newDoc = await databases.createDocument(DATABASE_ID, COLLECTION_ID_RT01, ID.unique(), {
            Nama: namaWarga,
            ...updatePayload
          });
          targetId = newDoc.$id;
          alert(`Warga baru ${namaWarga} berhasil ditambahkan!`);
        }
      }

      // DUAL WRITE: Simpan histori ke Collection Histori untuk SETIAP bulan yang dipilih
      // =======================================================
      // DUAL WRITE HISTORI (Dibungkus try-catch tersendiri)
      // =======================================================
      try {
        const historiPromises = selectedMonths.map(bulan => 
          databases.createDocument(DATABASE_ID, COLLECTION_ID_HISTORI, ID.unique(), {
            Id_warga: targetId,
            Nama: namaWarga,
            Rt: "RT 01", // Pastikan ini RT 02 atau RT 03 di file masing-masing
            Bulan: bulan,
            Nominal: String(numericNominal),
          })
        );
        await Promise.all(historiPromises);
      } catch (historiError) {
        // Jika histori gagal (misal karena belum setting permission Appwrite),
        // sistem hanya akan mencatat di console, TANPA menggagalkan refresh tabel!
        console.error("Gagal merekam histori transaksi:", historiError);
      }
      // =======================================================
      
      // KODE DI BAWAH INI SEKARANG AKAN TETAP BERJALAN DENGAN AMAN!
      setIsEditing(null);
      setSelectedMonths([]);
      setNamaWarga('');
      setNominal('10000');
      fetchData(); // <--- Ini yang membuat tabel otomatis ter-refresh!
      
    } catch (error) {
      console.error("Gagal menyimpan data utama:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    }
  };

  const handleCellClick = async (item: BillingRecord, bulan: string, nominalUang: number) => {
    if (nominalUang === 0) return; 

    setInfoDetail({ loading: true, nama: item.Nama, bulan: bulan, nominal: nominalUang, tanggalBayar: '' });

    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_HISTORI, [
        Query.equal('Id_warga', item.$id),
        Query.equal('Bulan', bulan),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]);

      if (response.documents.length > 0) {
        setInfoDetail({
          loading: false,
          nama: item.Nama,
          bulan: bulan,
          nominal: nominalUang,
          tanggalBayar: response.documents[0].$createdAt
        });
      } else {
        setInfoDetail({
          loading: false,
          nama: item.Nama,
          bulan: bulan,
          nominal: nominalUang,
          tanggalBayar: item.$updatedAt || new Date().toISOString(),
          isLegacy: true 
        });
      }
    } catch (error) {
      console.error("Gagal mengambil histori:", error);
      setInfoDetail({
        loading: false,
        nama: item.Nama,
        bulan: bulan,
        nominal: nominalUang,
        tanggalBayar: item.$updatedAt,
        isLegacy: true
      });
    }
  };

  const formatWaktu = (isoString: string) => {
    if (!isoString || isoString === '-') return '-';
    return new Date(isoString).toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });
  };

  const handleEdit = (item: BillingRecord) => {
    setIsEditing(item.$id);
    setNamaWarga(item.Nama);
    setSelectedMonths([]);
    setNominal('10000');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setNamaWarga('');
    setSelectedMonths([]);
    setNominal('10000');
    setIsDropdownOpen(false);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin hapus data ${nama}?`)) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_RT01, id);
        fetchData();
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

  const daftarNamaUnik = Array.from(new Set(residents.map((r) => r.Nama).filter(Boolean)));
  const filteredNama = daftarNamaUnik.filter(nama => nama.toLowerCase().includes(namaWarga.toLowerCase()));

  const totalCollected = residents.reduce((acc, curr) => {
    const sumRow = months.reduce((mAcc, month) => mAcc + (Number(curr[month as keyof BillingRecord]) || 0), 0);
    return acc + sumRow;
  }, 0);
  const targetPerCell = 10000;
  const totalTargetCell = residents.length * months.length * targetPerCell;
  const pendingDues = Math.max(0, totalTargetCell - totalCollected);
  const amount75 = totalCollected * 0.75;
  const amount25 = totalCollected * 0.25;
  const collectionRate = totalTargetCell > 0 ? ((totalCollected / totalTargetCell) * 100).toFixed(1) : '0';

  return (
    <PageLayout activeMenu="rt01">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">RT 01 Financial Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Manage monthly dues and payment records for residents of RT 01.</p>
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
              {isEditing ? '✏️ Edit Record Iuran' : 'Input Pembayaran Iuran (Bisa Multi-Bulan)'}
            </h3>
            {isEditing && (
              <button type="button" onClick={handleCancelEdit} className="text-sm bg-white border border-slate-300 px-3 py-1 rounded text-slate-600 hover:text-red-500 font-medium">
                X Batal Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSaveRecord} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Warga */}
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
                        onMouseDown={() => setIsDropdownOpen(false)} 
                        className="p-2.5 text-sm bg-blue-50 text-blue-800 font-semibold cursor-pointer sticky bottom-0 border-t border-blue-100"
                      >
                        + Jadikan "{namaWarga}" warga baru
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nominal Per Bulan (Rp)</label>
                <input 
                  type="number" 
                  placeholder="10000" 
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  required
                />
              </div>
            </div>

            {/* CHECKBOX PILIHAN BULAN (BISA BANYAK SEKALIGUS) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase">Pilih Bulan Pembayaran</label>
                <div className="space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedMonths([...months])}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedMonths([])}
                    className="text-[11px] text-red-500 hover:underline font-semibold"
                  >
                    Reset Pilihan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {months.map((m) => {
                  const isChecked = selectedMonths.includes(m);
                  return (
                    <label 
                      key={m} 
                      className={`flex items-center gap-2.5 p-2 rounded border text-xs cursor-pointer transition ${
                        isChecked 
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMonths([...selectedMonths, m]);
                          } else {
                            setSelectedMonths(selectedMonths.filter(item => item !== m));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-100 w-4 h-4 cursor-pointer"
                      />
                      {m}
                    </label>
                  );
                })}
              </div>
            </div>

            <button type="submit" className={`w-full text-white font-medium py-3 px-4 rounded-lg text-sm transition ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-900 hover:bg-blue-800'}`}>
              {isEditing ? '💾 Update Record Iuran' : `💾 Simpan Pembayaran (${selectedMonths.length} Bulan Terpilih)`}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-lg text-slate-800">Tabel Iuran Warga RT 01</h3>
          
          <button 
            type="button"
            onClick={handleDownloadPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            📥 DOWNLOAD Laporan PDF
          </button>
        </div>

        <div className="w-full overflow-auto max-h-[65vh] border-t border-slate-200">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-4 font-semibold sticky top-0 left-0 z-20 bg-slate-100 text-sm text-slate-600 border-b border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">NAMA</th>
                {months.map(m => (
                  <th key={m} className="py-3 px-4 font-semibold sticky top-0 z-10 text-sm text-slate-600 border-b border-slate-200">{m}</th>
                ))}
                {userRole !== 'warga' && <th className="p-4 font-semibold text-center bg-slate-50 border-l">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {residents.length === 0 && !loading && (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-slate-500 italic">Belum ada data warga di RT 01</td>
                </tr>
              )}
              {residents.map((item) => (
                <tr key={item.$id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                    {item.Nama}
                  </td>
                  
                  {months.map((bulan) => {
                    const uangBulan = Number(item[bulan as keyof BillingRecord]) || 0;
                    return (
                      <td 
                        key={bulan} 
                        onClick={() => handleCellClick(item, bulan, uangBulan)}
                        className={`p-4 text-center border-r border-slate-50 transition ${uangBulan > 0 ? 'cursor-pointer hover:bg-blue-100 hover:shadow-inner text-slate-800' : 'text-slate-400 cursor-default'}`}
                        title={uangBulan > 0 ? "Klik untuk lihat detail histori pembayaran" : ""}
                      >
                        {uangBulan > 0 ? uangBulan.toLocaleString('id-ID') : 0}
                      </td>
                    );
                  })}

                  {userRole !== 'warga' && (
                    <td className="p-4 text-center bg-slate-50 border-l">
                      <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs mr-2 transition">Edit</button>
                      {userRole === 'admin' && (
                        <button onClick={() => handleDelete(item.$id, item.Nama)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition">Hapus</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KUITANSI DIGITAL */}
      {infoDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity" 
          onClick={() => setInfoDetail(null)}
        >
          <div 
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all m-4" 
            onClick={e => e.stopPropagation()} 
          >
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-blue-900">Kuitansi Digital</h3>
              <button onClick={() => setInfoDetail(null)} className="text-slate-400 hover:text-red-500 font-bold text-xl">✕</button>
            </div>
            
            {infoDetail.loading ? (
              <div className="py-8 text-center text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium">Mencari histori transaksi...</p>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Nama Warga</p>
                  <p className="font-bold text-base text-slate-800">{infoDetail.nama}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Bulan Iuran</p>
                    <p className="font-bold text-slate-800">{infoDetail.bulan}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Nominal</p>
                    <p className="font-bold text-emerald-600">Rp {infoDetail.nominal.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Tercatat Pada Sistem:</p>
                  <p className="font-medium text-slate-700 flex items-center gap-2">
                    ✅ {formatWaktu(infoDetail.tanggalBayar)}
                  </p>
                </div>
                {infoDetail.isLegacy && (
                  <p className="text-[10px] text-orange-500 italic text-center mt-2 font-medium bg-orange-50 p-2 rounded">
                    *Waktu di atas adalah batas update terakhir. Data ini diinput sebelum fitur Histori aktif.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <button 
                onClick={() => setInfoDetail(null)} 
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  );
}