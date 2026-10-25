import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 text-[#D97706] flex items-center justify-center font-extrabold text-3xl mx-auto shadow-sm">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#0F1E36]">Halaman Tidak Ditemukan</h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan salah.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F1E36] hover:bg-[#162C4E] text-white font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
