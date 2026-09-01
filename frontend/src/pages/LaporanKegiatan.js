import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_KEUANGAN, getUserRole } from '../services/appwriteConfig';
import { Query, ID } from 'appwrite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export default function LaporanKegiatan() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('warga');
    // State Layar 1 (Daftar Folder Kegiatan)
    const [namaKegiatanBaru, setNamaKegiatanBaru] = useState('');
    // State Layar 2 (Detail Transaksi)
    const [activeKegiatan, setActiveKegiatan] = useState(null);
    // State Form Transaksi
    const [tglTransaksi, setTglTransaksi] = useState('');
    const [debitInput, setDebitInput] = useState('');
    const [creditInput, setCreditInput] = useState('');
    const [keterangan, setKeterangan] = useState('');
    useEffect(() => {
        async function init() {
            const role = await getUserRole();
            setUserRole(role);
            // Proteksi Halaman: Jika bukan bendahara atau admin, tendang keluar
            if (role !== 'bendahara' && role !== 'admin') {
                alert("Akses ditolak! Menu ini khusus untuk Bendahara dan Admin.");
                window.location.href = "/";
                return;
            }
            fetchData();
        }
        init();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_KEUANGAN, [
                Query.limit(500),
                Query.orderDesc('tanggal')
            ]);
            setRecords(res.documents);
        }
        catch (error) {
            console.error("Gagal load data keuangan", error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleBuatKegiatanBaru = async (e) => {
        e.preventDefault();
        if (!namaKegiatanBaru.trim())
            return;
        try {
            const tanggalSekarang = new Date().toISOString();
            await databases.createDocument(DATABASE_ID, COLLECTION_ID_KEUANGAN, ID.unique(), {
                nama: namaKegiatanBaru.trim(),
                tanggal: tanggalSekarang,
                debit: 0,
                credit: 0,
                keterangan: "Folder Utama",
                saldo: "0"
            });
            setNamaKegiatanBaru('');
            alert("Folder Kegiatan Baru Berhasil Dibuat!");
            fetchData();
        }
        catch (error) {
            console.error("Detail Error Appwrite:", error);
            alert(`Gagal membuat kegiatan: ${error.message || "Periksa kembali tipe data kolom di Appwrite."}`);
        }
    };
    const handleHapusKegiatan = async (nama) => {
        if (window.confirm(`HAPUS PERMANEN seluruh laporan untuk kegiatan "${nama}"?`)) {
            try {
                const toDelete = records.filter(r => r.nama === nama);
                await Promise.all(toDelete.map(r => databases.deleteDocument(DATABASE_ID, COLLECTION_ID_KEUANGAN, r.$id)));
                alert(`Laporan "${nama}" berhasil dihapus.`);
                fetchData();
            }
            catch (error) {
                alert("Gagal menghapus kegiatan.");
            }
        }
    };
    const handleSimpanTransaksi = async (e) => {
        e.preventDefault();
        if (!activeKegiatan || !tglTransaksi)
            return alert("Pilih tanggal transaksi!");
        const nilaiDebit = Number(debitInput) || 0;
        const nilaiCredit = Number(creditInput) || 0;
        const nilaiSaldoText = String(nilaiDebit - nilaiCredit);
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_ID_KEUANGAN, ID.unique(), {
                nama: activeKegiatan,
                tanggal: new Date(tglTransaksi).toISOString(),
                debit: nilaiDebit,
                credit: nilaiCredit,
                keterangan: keterangan || '-',
                saldo: nilaiSaldoText
            });
            setTglTransaksi('');
            setDebitInput('');
            setCreditInput('');
            setKeterangan('');
            fetchData();
        }
        catch (error) {
            alert("Gagal menyimpan transaksi.");
        }
    };
    const handleHapusTransaksi = async (id) => {
        if (window.confirm("Hapus baris transaksi ini?")) {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_KEUANGAN, id);
                fetchData();
            }
            catch (error) {
                alert("Gagal menghapus transaksi.");
            }
        }
    };
    const daftarKegiatanUnik = Array.from(new Set(records.map(r => r.nama).filter(Boolean)));
    const transaksiList = records
        .filter(r => r.nama === activeKegiatan && !(r.debit === 0 && r.credit === 0 && r.keterangan === 'Folder Utama'))
        .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    const totalDebit = transaksiList.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = transaksiList.reduce((acc, curr) => acc + curr.credit, 0);
    const saldoAkhir = totalDebit - totalCredit;
    const isBendahara = userRole === 'bendahara' || userRole === 'admin';
    const handleDownloadPDF = () => {
        if (!activeKegiatan)
            return;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 138);
        doc.text(`Buku Kas Kegiatan: ${activeKegiatan}`, 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 27);
        let runningSaldo = 0;
        const tableColumn = ["No", "Tanggal", "Keterangan", "Debit (Masuk)", "Credit (Keluar)", "Saldo (Rp)"];
        const tableRows = transaksiList.map((item, index) => {
            runningSaldo += (item.debit - item.credit);
            return [
                index + 1,
                new Date(item.tanggal).toLocaleDateString('id-ID'),
                item.keterangan,
                item.debit > 0 ? item.debit.toLocaleString('id-ID') : '-',
                item.credit > 0 ? item.credit.toLocaleString('id-ID') : '-',
                runningSaldo.toLocaleString('id-ID')
            ];
        });
        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: 35, theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [30, 58, 138] },
        });
        const akhirY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Pemasukan (Debit): Rp ${totalDebit.toLocaleString('id-ID')}`, 14, akhirY);
        doc.text(`Total Pengeluaran (Credit): Rp ${totalCredit.toLocaleString('id-ID')}`, 14, akhirY + 6);
        doc.text(`Sisa Saldo Kas: Rp ${saldoAkhir.toLocaleString('id-ID')}`, 14, akhirY + 12);
        doc.save(`Laporan_Kas_${activeKegiatan.replace(/\s/g, '_')}.pdf`);
    };
    return (_jsxs(PageLayout, { activeMenu: "kegiatan", children: [!activeKegiatan && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-6 flex justify-between items-center", children: _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-blue-900", children: "Manajemen Laporan Keuangan" }), _jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Pilih atau buat laporan kegiatan untuk mencatat transaksi." })] }) }), _jsxs("div", { className: "bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-end gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 uppercase mb-1", children: "Buat Laporan Kegiatan Baru" }), _jsx("input", { type: "text", value: namaKegiatanBaru, onChange: (e) => setNamaKegiatanBaru(e.target.value), placeholder: "Contoh: Perayaan 17 Agustus 2026, Kas Pembangunan...", className: "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" })] }), _jsx("button", { onClick: handleBuatKegiatanBaru, className: "bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition", children: "+ Buat Laporan Baru" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [daftarKegiatanUnik.length === 0 && !loading && (_jsx("div", { className: "col-span-full text-center p-10 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300", children: "Belum ada folder kegiatan yang dibuat." })), daftarKegiatanUnik.map((namaKeg, idx) => (_jsxs("div", { className: "bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group relative overflow-hidden", children: [_jsx("div", { className: "w-1.5 h-full bg-emerald-500 absolute left-0 top-0" }), _jsx("h3", { className: "font-bold text-lg text-slate-800 mb-4 ml-2", children: namaKeg }), _jsxs("div", { className: "flex gap-2 ml-2", children: [_jsx("button", { onClick: () => setActiveKegiatan(namaKeg), className: "flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold py-2 rounded-lg text-sm transition text-center", children: "Buka Laporan" }), _jsx("button", { onClick: () => handleHapusKegiatan(namaKeg), className: "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg text-sm transition", children: "Hapus" })] })] }, idx)))] })] })), activeKegiatan && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-4", children: _jsx("button", { onClick: () => setActiveKegiatan(null), className: "text-sm font-semibold text-slate-500 hover:text-blue-700 flex items-center gap-1 transition", children: "\u2190 Kembali ke Daftar Kegiatan" }) }), _jsxs("div", { className: "mb-6 flex justify-between items-end", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-blue-900", children: activeKegiatan }), _jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Buku kas dan rincian transaksi untuk kegiatan ini." })] }), _jsx("button", { onClick: handleDownloadPDF, className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2", children: "\uD83D\uDCE5 DOWNLOAD PDF" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white p-5 rounded-xl border border-blue-200 shadow-sm border-l-4 border-l-blue-600", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Total Pemasukan (Debit)" }), _jsxs("h3", { className: "text-2xl font-bold text-blue-700", children: ["Rp ", totalDebit.toLocaleString('id-ID')] })] }), _jsxs("div", { className: "bg-white p-5 rounded-xl border border-red-200 shadow-sm border-l-4 border-l-red-500", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Total Pengeluaran (Credit)" }), _jsxs("h3", { className: "text-2xl font-bold text-red-600", children: ["Rp ", totalCredit.toLocaleString('id-ID')] })] }), _jsxs("div", { className: `p-5 rounded-xl border shadow-sm border-l-4 ${saldoAkhir >= 0 ? 'bg-emerald-50 border-emerald-200 border-l-emerald-600' : 'bg-orange-50 border-orange-200 border-l-orange-500'}`, children: [_jsx("p", { className: "text-xs font-bold text-slate-600 uppercase tracking-wider mb-1", children: "Saldo Akhir" }), _jsxs("h3", { className: `text-2xl font-bold ${saldoAkhir >= 0 ? 'text-emerald-700' : 'text-orange-700'}`, children: ["Rp ", saldoAkhir.toLocaleString('id-ID')] })] })] }), _jsxs("div", { className: "p-5 bg-white rounded-xl border border-slate-200 shadow-sm mb-6", children: [_jsx("h3", { className: "font-bold text-slate-800 mb-3 text-sm uppercase", children: "\uD83D\uDCDD Tambah Transaksi Keuangan" }), _jsxs("form", { onSubmit: handleSimpanTransaksi, className: "grid grid-cols-1 md:grid-cols-5 gap-3 items-end", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Tanggal" }), _jsx("input", { type: "date", value: tglTransaksi, onChange: (e) => setTglTransaksi(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg p-2 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Keterangan" }), _jsx("input", { type: "text", value: keterangan, onChange: (e) => setKeterangan(e.target.value), placeholder: "Contoh: Beli Aqua...", required: true, className: "w-full border border-slate-300 rounded-lg p-2 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Debit (Masuk Rp)" }), _jsx("input", { type: "number", value: debitInput, onChange: (e) => setDebitInput(e.target.value), placeholder: "0", className: "w-full border border-slate-300 rounded-lg p-2 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 mb-1", children: "Credit (Keluar Rp)" }), _jsx("input", { type: "number", value: creditInput, onChange: (e) => setCreditInput(e.target.value), placeholder: "0", className: "w-full border border-slate-300 rounded-lg p-2 text-sm" })] }), _jsx("button", { type: "submit", className: "w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 rounded-lg text-sm", children: "+ Simpan Transaksi" })] })] }), _jsx("div", { className: "bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse min-w-[900px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50", children: [_jsx("th", { className: "p-4 font-semibold w-12 text-center", children: "No" }), _jsx("th", { className: "p-4 font-semibold", children: "Tanggal" }), _jsx("th", { className: "p-4 font-semibold", children: "Keterangan" }), _jsx("th", { className: "p-4 font-semibold text-right text-blue-600", children: "Debit (Masuk)" }), _jsx("th", { className: "p-4 font-semibold text-right text-red-500", children: "Credit (Keluar)" }), _jsx("th", { className: "p-4 font-semibold text-right text-emerald-600", children: "Saldo" }), isBendahara && _jsx("th", { className: "p-4 font-semibold text-center border-l", children: "Aksi" })] }) }), _jsx("tbody", { className: "text-sm", children: transaksiList.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "p-6 text-center text-slate-500 italic", children: "Buku kas masih kosong." }) })) : (() => {
                                            let runningSaldo = 0;
                                            return transaksiList.map((item, index) => {
                                                runningSaldo += (item.debit - item.credit);
                                                return (_jsxs("tr", { className: "border-b border-slate-100 hover:bg-slate-50", children: [_jsx("td", { className: "p-4 text-center text-slate-500", children: index + 1 }), _jsx("td", { className: "p-4 font-medium text-slate-700", children: new Date(item.tanggal).toLocaleDateString('id-ID') }), _jsx("td", { className: "p-4 text-slate-600", children: item.keterangan }), _jsx("td", { className: "p-4 text-right font-semibold text-blue-700", children: item.debit > 0 ? item.debit.toLocaleString('id-ID') : '-' }), _jsx("td", { className: "p-4 text-right font-semibold text-red-600", children: item.credit > 0 ? item.credit.toLocaleString('id-ID') : '-' }), _jsx("td", { className: "p-4 text-right font-bold text-emerald-700", children: runningSaldo.toLocaleString('id-ID') }), isBendahara && (_jsx("td", { className: "p-4 text-center border-l bg-slate-50", children: _jsx("button", { onClick: () => handleHapusTransaksi(item.$id), className: "bg-white border border-slate-300 text-red-600 hover:bg-red-50 hover:border-red-200 px-3 py-1 rounded text-xs font-semibold", children: "Hapus" }) }))] }, item.$id));
                                            });
                                        })() })] }) }) })] }))] }));
}
