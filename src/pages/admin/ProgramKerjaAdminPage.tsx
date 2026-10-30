import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppAuth } from '../../components/auth/AuthContext';
import {
  deleteProgram,
  getAdminPrograms,
  setProgramStatus,
  type AdminProgramSummary,
} from '../../services/content-api';
import { ConfirmDialog, FormMessage } from '../../components/admin/AdminForm';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function ProgramKerjaAdminPage() {
  const { token } = useAppAuth();
  const [rows, setRows] = useState<AdminProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminProgramSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdminPrograms(token);
      setRows(res.data);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal memuat program kerja.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStatus = async (row: AdminProgramSummary) => {
    setMessage(null);
    try {
      await setProgramStatus(row.id, row.status === 'published' ? 'draft' : 'published', token);
      await load();
      setMessage({
        text: row.status === 'published' ? 'Program dikembalikan ke draf.' : 'Program diterbitkan.',
        type: 'success',
      });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal mengubah status.', type: 'error' });
    }
  };

  const runDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteProgram(pendingDelete.id, token);
      await load();
      setMessage({ text: 'Program kerja dihapus.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menghapus program.', type: 'error' });
    } finally {
      setPendingDelete(null);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-[#0F1E36]">Program Kerja</h1>
          <p className="text-xs text-slate-600">
            Draf tidak tampil di halaman publik. Terbitkan setelah foto dan video siap.
          </p>
        </div>
        <Link
          to="/admin/program-kerja/baru"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Tambah Program
        </Link>
      </header>

      <FormMessage message={message} />

      {loading ? (
        <LoadingSkeleton type="text" count={2} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum Ada Program Kerja"
          description="Tambahkan program kerja pertama. Simpan sebagai draf, lalu terbitkan saat konten lengkap."
          icon={CalendarDays}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Daftar program kerja</caption>
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Program</th>
                <th scope="col" className="px-4 py-3 font-bold">Tahun</th>
                <th scope="col" className="px-4 py-3 font-bold">Status</th>
                <th scope="col" className="px-4 py-3 font-bold">Media</th>
                <th scope="col" className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        {row.coverUrl && (
                          <img src={row.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-[#0F1E36] truncate max-w-[16rem]">{row.title}</span>
                        <span className="text-[11px] text-slate-500 truncate block max-w-[16rem]">
                          {row.universityName ?? 'Umum'} · /{row.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.year}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.status === 'published' ? 'Terbit' : 'Draf'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.photoCount} foto · {row.videoCount} video
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => void toggleStatus(row)}
                        aria-label={
                          row.status === 'published' ? `Jadikan draf ${row.title}` : `Terbitkan ${row.title}`
                        }
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        {row.status === 'published' ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      <Link
                        to={`/admin/program-kerja/${row.id}`}
                        aria-label={`Ubah ${row.title}`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(row)}
                        aria-label={`Hapus ${row.title}`}
                        className="p-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Hapus program "${pendingDelete?.title ?? ''}"?`}
        description="Program kerja disembunyikan dari publik (soft delete) dan semua foto serta sampulnya dihapus dari penyimpanan. Tindakan ini tidak dapat dibatalkan lewat panel."
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={runDelete}
      />
    </div>
  );
}
