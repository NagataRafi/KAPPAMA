import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../../components/auth/AuthContext';
import {
  getDistricts,
  getVillages,
  getUniversities,
  getStudyPrograms,
  getIndustries,
  submitOnboarding,
} from '../../services/api';
import { ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { TurnstileWidget } from '../../components/auth/TurnstileWidget';

export function OnboardingPage() {
  const { isSignedIn, token, refetchProfile, user } = useAppAuth();
  const navigate = useNavigate();

  // State master data
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [villages, setVillages] = useState<Array<{ id: string; name: string }>>([]);
  const [universities, setUniversities] = useState<Array<{ id: string; name: string; abbreviation: string }>>([]);
  const [studyPrograms, setStudyPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([]);

  // Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [memberType, setMemberType] = useState<'active' | 'alumni'>('active');
  const [cohortYear, setCohortYear] = useState<number>(new Date().getFullYear());
  const [universityId, setUniversityId] = useState('');
  const [universityOther, setUniversityOther] = useState('');
  const [studyProgramId, setStudyProgramId] = useState('');
  const [studyProgramOther, setStudyProgramOther] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [villageId, setVillageId] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [hideContact, setHideContact] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Alumni fields
  const [graduationYear, setGraduationYear] = useState<number>(new Date().getFullYear());
  const [currentStatus, setCurrentStatus] = useState<'working' | 'entrepreneur' | 'studying' | 'job_seeking' | 'other'>('working');
  const [jobTitle, setJobTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [workCity, setWorkCity] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load master data awal
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [distRes, univRes, indRes] = await Promise.all([
          getDistricts(),
          getUniversities(),
          getIndustries(),
        ]);
        setDistricts(distRes);
        setUniversities(univRes);
        setIndustries(indRes);
      } catch (err) {
        console.error('Gagal memuat master data:', err);
      }
    }
    loadInitialData();
  }, []);

  // Update daftar desa ketika kecamatan berubah
  useEffect(() => {
    if (!districtId) {
      setVillages([]);
      setVillageId('');
      return;
    }
    getVillages(districtId)
      .then((data) => {
        setVillages(data);
        if (data.length > 0) setVillageId(data[0].id);
      })
      .catch((err) => console.error('Gagal memuat desa:', err));
  }, [districtId]);

  // Update daftar prodi ketika universitas berubah
  useEffect(() => {
    if (!universityId) {
      setStudyPrograms([]);
      setStudyProgramId('');
      return;
    }
    getStudyPrograms(universityId)
      .then((data) => {
        setStudyPrograms(data);
        if (data.length > 0) setStudyProgramId(data[0].id);
      })
      .catch((err) => console.error('Gagal memuat prodi:', err));
  }, [universityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!consentAgreed) {
      setErrorMessage('Anda wajib menyetujui pemrosesan data pribadi untuk melanjutkan.');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('Selesaikan verifikasi "bukan robot" terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        fullName,
        username: username.toLowerCase().trim(),
        whatsapp,
        instagram: instagram ? instagram.replace('@', '').trim() : null,
        linkedin: linkedin ? linkedin.trim() : null,
        memberType,
        cohortYear: Number(cohortYear),
        universityId,
        universityOther: universityId && universities.find(u => u.id === universityId)?.abbreviation === 'Lainnya' ? universityOther : null,
        studyProgramId,
        studyProgramOther: studyProgramId && studyPrograms.find(sp => sp.id === studyProgramId)?.name === 'Lainnya' ? studyProgramOther : null,
        districtId,
        villageId,
        addressDetail,
        hideContact,
        turnstileToken: turnstileToken ?? '',
        consentAgreed: true,
        consentVersion: '2026.1',
        ...(memberType === 'alumni' && {
          graduationYear: Number(graduationYear),
          currentStatus,
          jobTitle: jobTitle || null,
          organization: organization || null,
          industryId: industryId || null,
          workCity: workCity || null,
        }),
      };

      await submitOnboarding(payload, token);
      await refetchProfile();
      navigate('/status');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data profil.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSelectedUnivOther = universities.find(u => u.id === universityId)?.abbreviation === 'Lainnya';
  const isSelectedProdiOther = studyPrograms.find(sp => sp.id === studyProgramId)?.name === 'Lainnya';

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-[#0F1E36] p-8 text-white relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-9 h-9 rounded-xl bg-[#D97706] flex items-center justify-center font-bold text-white text-lg">
              K
            </span>
            <span className="text-amber-400 font-bold uppercase tracking-wider text-xs">
              Formulir Keanggotaan Resmi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lengkapi Profil KAPPAMA
          </h1>
          <p className="text-slate-300 text-sm mt-2 max-w-xl">
            Satu langkah lagi untuk bergabung ke dalam jejaring mahasiswa dan alumni Pacitan di Malang. Data Anda dilindungi sesuai UU PDP No. 27/2022.
          </p>
        </div>

        {/* Formulir */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Tipe Keanggotaan */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#0F172A]">
              Daftar Sebagai <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMemberType('active')}
                className={`py-3.5 px-4 rounded-2xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  memberType === 'active'
                    ? 'border-[#D97706] bg-amber-50/50 text-[#0F1E36]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#D97706]" />
                <span>Anggota Aktif (Mahasiswa)</span>
              </button>
              <button
                type="button"
                onClick={() => setMemberType('alumni')}
                className={`py-3.5 px-4 rounded-2xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  memberType === 'alumni'
                    ? 'border-[#D97706] bg-amber-50/50 text-[#0F1E36]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                <span>Alumni KAPPAMA</span>
              </button>
            </div>
          </div>

          {/* 2. Informasi Pribadi */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-[#0F1E36]">Data Pribadi & Kontak</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama sesuai KTP"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Unik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="misal: bagas_pacitan"
                  pattern="^[a-z0-9_]{3,20}$"
                  title="3-20 karakter, huruf kecil, angka, atau garis bawah"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instagram (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">@</span>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="username"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profil LinkedIn (Opsional)
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

          {/* 3. Pendidikan & Studi di Malang */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-[#0F1E36]">Pendidikan di Kota Malang</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perguruan Tinggi <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm bg-white"
                >
                  <option value="">Pilih Kampus...</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Program Studi <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={studyProgramId}
                  onChange={(e) => setStudyProgramId(e.target.value)}
                  disabled={!universityId}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm bg-white disabled:bg-slate-50"
                >
                  <option value="">Pilih Program Studi...</option>
                  {studyPrograms.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isSelectedUnivOther && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kampus Lainnya <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={universityOther}
                  onChange={(e) => setUniversityOther(e.target.value)}
                  placeholder="Tuliskan nama lengkap kampus"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                />
              </div>
            )}

            {isSelectedProdiOther && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Program Studi Lainnya <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studyProgramOther}
                  onChange={(e) => setStudyProgramOther(e.target.value)}
                  placeholder="Tuliskan nama prodi lengkap"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Angkatan (Tahun Masuk Kuliah) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1990}
                max={2035}
                value={cohortYear}
                onChange={(e) => setCohortYear(parseInt(e.target.value))}
                className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
              />
            </div>
          </div>

          {/* 4. Khusus Alumni (Jika Tipe = Alumni) */}
          {memberType === 'alumni' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
              <h2 className="text-base font-bold text-[#D97706]">Informasi Khusus Alumni</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Kelulusan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={2035}
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value as 'working' | 'entrepreneur' | 'studying' | 'job_seeking' | 'other')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    <option value="working">Bekerja (Karyawan/Profesional)</option>
                    <option value="entrepreneur">Wirausaha / Bisnis Mandiri</option>
                    <option value="studying">Studi Lanjut (S2/S3/Spesialis)</option>
                    <option value="job_seeking">Mencari Kerja</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="misal: Software Engineer"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instansi / Perusahaan
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Nama perusahaan/organisasi"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sektor / Bidang Industri
                  </label>
                  <select
                    value={industryId}
                    onChange={(e) => setIndustryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kota Tempat Bekerja
                  </label>
                  <input
                    type="text"
                    value={workCity}
                    onChange={(e) => setWorkCity(e.target.value)}
                    placeholder="misal: Jakarta, Surabaya, Malang"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Alamat Asal Kabupaten Pacitan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-[#0F1E36]">Daerah Asal Kabupaten Pacitan</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecamatan Asal <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm bg-white"
                >
                  <option value="">Pilih Kecamatan di Pacitan...</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desa / Kelurahan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={villageId}
                  onChange={(e) => setVillageId(e.target.value)}
                  disabled={!districtId}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm bg-white disabled:bg-slate-50"
                >
                  <option value="">Pilih Desa / Kelurahan...</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Detail (Dusun / RT / RW / Jalan) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="misal: Dusun Krajan, RT 02 / RW 01, Jl. Melati No. 4"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D97706] text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                🔒 Sesuai UU PDP No. 27/2022, alamat detail ini bersifat rahasia dan <strong>TIDAK PERNAH</strong> ditampilkan pada direktori anggota umum.
              </p>
            </div>

            {/* Saklar Sembunyikan Kontak */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideContact}
                  onChange={(e) => setHideContact(e.target.checked)}
                  className="w-4 h-4 text-[#D97706] rounded border-slate-300 focus:ring-[#D97706]"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Sembunyikan nomor WhatsApp dan email saya dari direktori umum (hanya pengurus inti yang dapat melihat).
                </span>
              </label>
            </div>
          </div>

          {/* 6. Persetujuan Privasi UU PDP */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl space-y-3">
            <TurnstileWidget onToken={setTurnstileToken} />
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                className="w-4 h-4 text-[#D97706] rounded border-slate-300 focus:ring-[#D97706] mt-0.5"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Saya menyatakan bahwa data yang saya masukkan adalah benar, saya berasal dari Kabupaten Pacitan, dan saya menyetujui pemrosesan data pribadi saya oleh pengurus KAPPAMA sesuai dengan{' '}
                <a href="/kebijakan-privasi" target="_blank" className="text-[#D97706] underline font-bold">
                  Kebijakan Privasi
                </a>{' '}
                dan UU PDP No. 27/2022.
              </span>
            </label>
          </div>

          {/* Tombol Kirim */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isSignedIn}
              className="w-full py-4 rounded-2xl bg-[#D97706] hover:bg-amber-600 active:scale-[0.99] transition-all text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan & Memverifikasi Data...</span>
              ) : (
                <>
                  <span>Kirim Formulir & Ajukan Persetujuan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
