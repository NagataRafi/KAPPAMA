import { ShieldAlert } from 'lucide-react';

export function KebijakanPrivasiPage() {
  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-[#D97706]" />
          <span>
            <strong>[Pemberitahuan Draf]:</strong> Naskah Kebijakan Privasi ini disusun oleh pengembang berdasarkan kepatuhan prinsip UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi dan masih menunggu tinjauan resmi dari Dewan Pengurus KAPPAMA.
          </span>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm space-y-6">
          <h1 className="text-3xl font-extrabold text-[#0F1E36]">Kebijakan Privasi KAPPAMA</h1>
          <p className="text-xs text-slate-400">Terakhir diperbarui: 25 Oktober 2026 · Versi 1.0</p>

          <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">1. Komitmen Pelindungan Data</h2>
              <p>
                KAPPAMA (Keluarga Pelajar Pacitan di Malang) menghormati dan berkomitmen untuk melindungi data pribadi seluruh anggota, pendaftar, dan alumni sesuai dengan amanat Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">2. Data yang Dikumpulkan</h2>
              <p>Kami mengumpulkan data yang Anda berikan secara sukarela saat pendaftaran dan onboarding:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Informasi Identitas: Nama lengkap, username, dan email (dari akun Google via Clerk).</li>
                <li>Informasi Kontak: Nomor WhatsApp dan akun media sosial (Instagram, LinkedIn).</li>
                <li>Informasi Akademik: Status keanggotaan (aktif/alumni), tahun angkatan kuliah, universitas di Malang, dan program studi.</li>
                <li>Informasi Kedaerahan: Kecamatan dan desa/kelurahan asal di Kabupaten Pacitan, serta detail alamat tinggal (dusun/RT/RW).</li>
                <li>Informasi Alumni: Tahun kelulusan, status pekerjaan, nama instansi, bidang industri, dan kota domisili kerja.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">3. Kebijakan Kerahasiaan Data Sensitif</h2>
              <p>
                <strong>Detail Alamat:</strong> Kolom detail alamat (dusun/RT/RW/jalan) diklasifikasikan sebagai data pribadi sensitif ketat. Data ini <strong>tidak pernah dipublikasikan</strong> pada direktori anggota umum dan hanya dapat diakses oleh pemilik profil serta pengurus berwenang (Admin Konten dan Super Admin) untuk verifikasi.
              </p>
              <p>
                <strong>Privasi Kontak:</strong> Setiap anggota berhak mengaktifkan saklar &ldquo;Sembunyikan kontak saya&rdquo; agar nomor WhatsApp dan email tidak terlihat oleh sesama anggota biasa di direktori.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#0F1E36]">4. Hak-Hak Anda sebagai Subjek Data</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Hak Akses & Koreksi:</strong> Anda dapat meninjau dan memperbarui data profil Anda setiap saat melalui menu Profil Saya.</li>
                <li><strong>Hak Penghapusan (Right to be Forgotten):</strong> Anda berhak mengajukan penonaktifan atau penghapusan permanen akun kepada Super Admin.</li>
                <li><strong>Hak Portabilitas:</strong> Anda dapat meminta salinan data pribadi yang tersimpan dalam format terstruktur.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
