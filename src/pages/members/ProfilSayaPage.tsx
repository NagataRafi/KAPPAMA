import React, { useState, useEffect } from 'react';
import { useAppAuth } from '../../components/auth/AuthContext';
import { updateMyProfile, getIndustries } from '../../services/api';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export function ProfilSayaPage() {
  const { profile, token, refetchProfile, role } = useAppAuth();

  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [instagram, setInstagram] = useState(profile?.instagram || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
  const [hideContact, setHideContact] = useState(profile?.hideContact || false);
  const [memberType, setMemberType] = useState<'active' | 'alumni'>(profile?.memberType || 'active');

  // Alumni fields (jika transisi aktif -> alumni)
  const [graduationYear, setGraduationYear] = useState<number>(new Date().getFullYear());
  const [currentStatus, setCurrentStatus] = useState<'working' | 'entrepreneur' | 'studying' | 'job_seeking' | 'other'>('working');
  const [jobTitle, setJobTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [workCity, setWorkCity] = useState('');

  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getIndustries().then(setIndustries).catch(console.error);
  }, []);

  useEffect(() => {
    if (profile) {
      setWhatsapp(profile.whatsapp || '');
      setInstagram(profile.instagram || '');
      setLinkedin(profile.linkedin || '');
      setHideContact(profile.hideContact || false);
      setMemberType(profile.memberType || 'active');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        whatsapp,
        instagram: instagram ? instagram.replace('@', '').trim() : null,
        linkedin: linkedin ? linkedin.trim() : null,
        hideContact,
        memberType,
        ...(memberType === 'alumni' && {
          graduationYear: Number(graduationYear),
          currentStatus,
          jobTitle: jobTitle || null,
          organization: organization || null,
          industryId: industryId || null,
          workCity: workCity || null,
        }),
      };

      await updateMyProfile(payload, token);
      await refetchProfile();
      setSuccessMessage('Data profil Anda berhasil diperbarui!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan perubahan profil.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Profil */}
        <div className="bg-[#0F1E36] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full">
                Pengaturan Akun & Privasi
              </span>
              {role === 'super_admin' && (
                <span className="text-xs uppercase font-extrabold tracking-wider bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full">
                  Super Admin
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Profil Saya
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Kelola informasi kontak, kendali privasi direktori, dan perbarui status keanggotaan Anda.
            </p>
          </div>
        </div>

        {/* Formulir Pengaturan */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Informasi Akun Dasar (Read Only) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="block text-xs font-bold text-slate-700">Data Utama (Terkunci)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <span className="block text-slate-400">Nama Lengkap:</span>
                  <span className="font-bold text-slate-900">{profile?.fullName}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Username:</span>
                  <span className="font-bold text-slate-900">@{profile?.username}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-1">
                * Untuk perubahan nama lengkap atau kampus, harap menghubungi pengurus inti untuk diverifikasi pada audit log.
              </p>
            </div>

            {/* Kontak & Media Sosial */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold text-[#0F1E36]">Kontak & Media Sosial</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp (Format Indonesia: 08xxx atau +628xxx)
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="username"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    LinkedIn (URL Lengkap)
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                  />
                </div>
              </div>

              {/* Saklar Privasi Kontak */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideContact}
                    onChange={(e) => setHideContact(e.target.checked)}
                    className="w-4 h-4 text-[#D97706] rounded border-slate-300 focus:ring-[#D97706]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Sembunyikan nomor WhatsApp & email dari direktori umum
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Jika dicentang, kontak Anda tidak dapat dilihat oleh sesama anggota di direktori (hanya pengurus inti yang dapat mengakses).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Transisi Status: Menjadi Alumni */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-sm font-bold text-[#0F1E36]">Status Keanggotaan</h2>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMemberType('active')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 ${
                    memberType === 'active'
                      ? 'border-[#D97706] bg-amber-50 text-[#0F1E36]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#D97706]" />
                  <span>Mahasiswa Aktif</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMemberType('alumni')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 ${
                    memberType === 'alumni'
                      ? 'border-[#D97706] bg-amber-50 text-[#0F1E36]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                  <span>Sudah Lulus (Alumni)</span>
                </button>
              </div>

              {/* Form Tambahan Jika Memilih Alumni */}
              {memberType === 'alumni' && (
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-4">
                  <span className="block text-xs font-bold text-[#D97706]">Data Kelulusan & Karir Alumni</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Kelulusan</label>
                      <input
                        type="number"
                        min={1990}
                        max={2035}
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Status Saat Ini</label>
                      <select
                        value={currentStatus}
                        onChange={(e) => setCurrentStatus(e.target.value as 'working' | 'entrepreneur' | 'studying' | 'job_seeking' | 'other')}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      >
                        <option value="working">Bekerja</option>
                        <option value="entrepreneur">Wirausaha</option>
                        <option value="studying">Studi Lanjut</option>
                        <option value="job_seeking">Mencari Kerja</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan / Posisi</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="misal: Data Analyst"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Perusahaan / Instansi</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Nama perusahaan"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bidang Industri</label>
                      <select
                        value={industryId}
                        onChange={(e) => setIndustryId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      >
                        <option value="">Pilih Industri...</option>
                        {industries.map((ind) => (
                          <option key={ind.id} value={ind.id}>
                            {ind.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Kota Tempat Bekerja</label>
                      <input
                        type="text"
                        value={workCity}
                        onChange={(e) => setWorkCity(e.target.value)}
                        placeholder="misal: Malang, Jakarta"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Simpan */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#D97706] hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{isSaving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
