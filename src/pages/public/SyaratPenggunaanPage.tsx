import { ShieldAlert } from 'lucide-react';

export function SyaratPenggunaanPage() {
  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-[#D97706]" />
          <span>
            <strong>[Pemberitahuan Draf]:</strong> Naskah Syarat Penggunaan ini merupakan draf teknis operasional dan masih menunggu tinjauan resmi Dewan Pengurus KAPPAMA.
          </span>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm space-y-6">
          <h1 className="text-3xl font-extrabold text-[#0F1E36]">Syarat Penggunaan KAPPAMA</h1>
          <p className="text-xs text-slate-400">Terakhir diperbarui: 25 Oktober 2026 · Versi 1.0</p>

          <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">1. Ketentuan Umum</h2>
              <p>
                Dengan mengakses website KAPPAMA dan/atau mendaftarkan diri sebagai anggota, Anda menyetujui untuk terikat dengan syarat dan ketentuan penggunaan ini serta Anggaran Dasar & Anggaran Rumah Tangga (AD/ART) KAPPAMA.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">2. Akurasi & Tanggung Jawab Data</h2>
              <p>
                Setiap pendaftar berkewajiban memberikan informasi data diri yang benar, akurat, dan dapat dipertanggungjawabkan mengenai asal kedaerahan di Pacitan serta status perkuliahan di perguruan tinggi Kota Malang. Pengisian data palsu dapat berakibat pada penolakan atau penangguhan (*suspend*) keanggotaan oleh admin.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">3. Penggunaan Direktori Anggota</h2>
              <p>
                Direktori anggota dan alumni hanya boleh dimanfaatkan untuk kepentingan silaturahmi, jejaring akademik, dan koordinasi keorganisasian KAPPAMA. Dilarang keras menyalin, menyebarluaskan, atau memanfaatkan data anggota untuk keperluan komersial, spamming, penipuan, atau tindakan melawan hukum lainnya.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">4. Larangan & Penghentian Akses</h2>
              <p>
                Pengurus KAPPAMA berhak membatasi, menangguhkan, atau mencabut hak akses pengguna yang melanggar ketentuan hukum, etika keorganisasian, atau mencoba merusak integritas sistem website KAPPAMA.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
