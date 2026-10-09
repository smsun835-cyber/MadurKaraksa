import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_RT01, COLLECTION_ID_HISTORI, COLLECTION_ID_TAMBAHAN, getUserRole } from '../services/appwriteConfig';
import { Query, ID } from 'appwrite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillingRecord {
  $id: string;
  $updatedAt: string;
  Nama: string;
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

interface InfoDetail {
  loading: boolean;
  nama: string;
  bulan: string;
  nominal: number;
  tanggalBayar: string;
  isLegacy?: boolean;
}

interface DetailWargaHarian {
  nama: string;
  bulan: string;
  nominal: number;
}

interface DailyIncome {
  tanggal: string;
  rawDate: string;
  total: number;
  transaksi: DetailWargaHarian[];
}

export default function RT01Billing() {
  const [residents, setResidents] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('warga');

  const [namaWarga, setNamaWarga] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [nominal, setNominal] = useState('10000'); 
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const [infoDetail, setInfoDetail] = useState<InfoDetail | null>(null);
  const [dailyIncomes, setDailyIncomes] = useState<DailyIncome[]>([]);

  // State untuk modal detail harian (Validasi Kas)
  const [selectedDayDetail, setSelectedDayDetail] = useState<DailyIncome | null>(null);

  const months = ['September', 'Oktober','November', 'Desember', 'Januari', 'Febuari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus' ] as const;

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
      
      await fetchDailyIncome();
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyIncome = async () => {
    try {
      // Filter khusus RT 01
      const histResponse = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_HISTORI, [
        Query.equal('Rt', 'RT 01'),
        Query.limit(500)
      ]);

      const incomeMap: { [key: string]: { total: number; rawDate: string; transaksi: DetailWargaHarian[] } } = {};

      histResponse.documents.forEach((doc: any) => {
        const rawDate = doc.Tanggal_bayar || doc.$createdAt;
        if (!rawDate) return;
        
        const dateObj = new Date(rawDate);
        const dateKey = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        const nominalUang = Number(doc.Nominal) || 0;
        const detailWarga: DetailWargaHarian = {
          nama: doc.Nama || 'Tanpa Nama',
          bulan: doc.Bulan || '-',
          nominal: nominalUang
        };

        if (incomeMap[dateKey]) {
          incomeMap[dateKey].total += nominalUang;
          incomeMap[dateKey].transaksi.push(detailWarga);
        } else {
          incomeMap[dateKey] = {
            total: nominalUang,
            rawDate: rawDate,
            transaksi: [detailWarga]
          };
        }
      });

      const formattedDaily = Object.keys(incomeMap).map(tanggal => ({
        tanggal,
        rawDate: incomeMap[tanggal].rawDate,
        total: incomeMap[tanggal].total,
        transaksi: incomeMap[tanggal].transaksi
      }));

      formattedDaily.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

      setDailyIncomes(formattedDaily);
    } catch (err) {
      console.error("Gagal mengambil rekap harian:", err);
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

    const tableColumn = ["Nama Warga", "Sep", "Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu" ];
    const tableRows = residents.map(item => [
      item.Nama,
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

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaWarga.trim()) return alert("Silakan isi atau pilih nama warga!");
    if (selectedMonths.length === 0) return alert("Pilih minimal 1 bulan pembayaran!");
    if (!nominal) return alert("Masukkan nominal iuran!");

    try {
      let targetId = '';
      const numericNominal = Number(nominal);

      const nominalIuran = numericNominal > 10000 ? 10000 : numericNominal;
      const nominalTambahan = numericNominal > 10000 ? numericNominal - 10000 : 0;

      const updatePayloadIuran: Record<string, number> = {};
      const updatePayloadTambahan: Record<string, number> = {};
      
      selectedMonths.forEach(m => {
        updatePayloadIuran[m] = nominalIuran;
        updatePayloadTambahan[m] = nominalTambahan;
      });

      if (isEditing) {
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT01, isEditing, updatePayloadIuran);
        targetId = isEditing;
        alert(`Data iuran ${namaWarga} berhasil diperbarui!`);
      } else {
        const existingResident = residents.find(
          (r) => r.Nama.toLowerCase() === namaWarga.toLowerCase().trim()
        );

        if (existingResident) {
          await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT01, existingResident.$id, updatePayloadIuran);
          targetId = existingResident.$id;
          alert(`Berhasil menambahkan pembayaran untuk ${selectedMonths.length} bulan ke baris ${namaWarga}!`);
        } else {
          const newDoc = await databases.createDocument(DATABASE_ID, COLLECTION_ID_RT01, ID.unique(), {
            Nama: namaWarga,
            ...updatePayloadIuran
          });
          targetId = newDoc.$id;
          alert(`Warga baru ${namaWarga} berhasil ditambahkan!`);
        }
      }

      try {
        const waktuSimpan = new Date().toISOString();
        const historiPromises = selectedMonths.map(bulan => 
          databases.createDocument(DATABASE_ID, COLLECTION_ID_HISTORI, ID.unique(), {
            Id_warga: targetId,
            Nama: namaWarga,
            Rt: "RT 01", 
            Bulan: bulan,
            Nominal: String(numericNominal), 
            Tanggal_bayar: waktuSimpan
          })
        );
        await Promise.all(historiPromises);
      } catch (historiError) {
        console.error("Gagal merekam histori transaksi:", historiError);
      }

      try {
        if (nominalTambahan > 0 || isEditing) {
          const checkTambahan = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_TAMBAHAN, [
            Query.equal('ID_warga', targetId)
          ]);

          if (checkTambahan.documents.length > 0) {
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID_TAMBAHAN, checkTambahan.documents[0].$id, updatePayloadTambahan);
          } else if (nominalTambahan > 0) {
            await databases.createDocument(DATABASE_ID, COLLECTION_ID_TAMBAHAN, ID.unique(), {
              ID_warga: targetId,
              Nama: namaWarga,
              RT: "RT 01", 
              ...updatePayloadTambahan
            });
          }
        }
      } catch (tambahanError) {
        console.error("Gagal menyimpan ke tabel Tambahan:", tambahanError);
      }
      
      setIsEditing(null);
      setSelectedMonths([]);
      setNamaWarga('');
      setNominal('10000');
      fetchData(); 
      
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
        const dataHistori = response.documents[0];
        setInfoDetail({
          loading: false,
          nama: item.Nama,
          bulan: bulan,
          nominal: Number(dataHistori.Nominal) || nominalUang, 
          tanggalBayar: dataHistori.Tanggal_bayar || dataHistori.$createdAt
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

      {/* 3 CARD ATAS */}
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

      {/* --- CARD REKAP HARIAN (HANYA MUNCUL JIKA BUKAN WARGA) --- */}
      {userRole !== 'warga' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">📅 Rekap Penghasilan Penagihan Per Hari (Klik untuk Validasi)</h3>
            <span className="text-xs text-slate-400">Audit & Balancing Kas</span>
          </div>
          
          {dailyIncomes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">Belum ada data transaksi harian tercatat.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-44 overflow-y-auto pr-1">
              {dailyIncomes.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDayDetail(item)}
                  className="bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 p-3 rounded-lg flex flex-col justify-between cursor-pointer transition shadow-sm group"
                  title="Klik untuk melihat daftar warga yang membayar di tanggal ini"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-700">{item.tanggal}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{item.transaksi.length} Transaksi tercatat</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Total:</span>
                    <span className="text-base font-bold text-blue-700">Rp {item.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM INPUT */}
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase">Pilih Bulan Pembayaran</label>
                <div className="space-x-2">
                  <button type="button" onClick={() => setSelectedMonths([...months])} className="text-[11px] text-blue-600 hover:underline font-semibold">Pilih Semua</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => setSelectedMonths([])} className="text-[11px] text-red-500 hover:underline font-semibold">Reset Pilihan</button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
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
              {isEditing ? '💾 Update Record Iuran' : `💾 Simpan Pembayaran (${selectedMonths.length} Bulan Terpilih)`}
            </button>
          </form>
        </div>
      )}

      {/* TABEL UTAMA */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-lg text-slate-800">Tabel Iuran Warga RT 01</h3>
          <button type="button" onClick={handleDownloadPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2 cursor-pointer">
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
                <tr><td colSpan={14} className="p-6 text-center text-slate-500 italic">Belum ada data warga di RT 01</td></tr>
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

      {/* --- MODAL DETAIL VALIDASI HARIAN --- */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDayDetail(null)}>
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all m-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-blue-900">Validasi Kas: {selectedDayDetail.tanggal}</h3>
                <p className="text-xs text-slate-500">Daftar warga yang melakukan pembayaran pada tanggal ini</p>
              </div>
              <button onClick={() => setSelectedDayDetail(null)} className="text-slate-400 hover:text-red-500 font-bold text-xl">✕</button>
            </div>
            
            <div className="max-h-60 overflow-y-auto mb-4 border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2.5 border-b">Nama Warga</th>
                    <th className="p-2.5 border-b text-center">Bulan</th>
                    <th className="p-2.5 border-b text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayDetail.transaksi.map((trx, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-slate-800">{trx.nama}</td>
                      <td className="p-2.5 text-center text-slate-600">{trx.bulan}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">Rp {trx.nominal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center mb-5">
              <span className="text-xs font-bold text-blue-900 uppercase">Total Uang Masuk Hari Ini:</span>
              <span className="text-lg font-extrabold text-blue-700">Rp {selectedDayDetail.total.toLocaleString('id-ID')}</span>
            </div>

            <button onClick={() => setSelectedDayDetail(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition text-sm">
              Tutup / Selesai Validasi
            </button>
          </div>
        </div>
      )}

      {/* MODAL KUITANSI */}
      {infoDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setInfoDetail(null)}>
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all m-4" onClick={e => e.stopPropagation()}>
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
                  <p className="font-medium text-slate-700 flex items-center gap-2">✅ {formatWaktu(infoDetail.tanggalBayar)}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button onClick={() => setInfoDetail(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}