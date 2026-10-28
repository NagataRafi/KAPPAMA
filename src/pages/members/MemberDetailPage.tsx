import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppAuth } from '../../components/auth/AuthContext';
import { getMemberDetail, ApiMemberProfile } from '../../services/api';
import {
  GraduationCap,
  MapPin,
  Briefcase,
  MessageCircle,
  Mail,
  Linkedin,
  Instagram,
  ArrowLeft,
  Lock,
  Building,
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function MemberDetailPage() {
  const { username } = useParams<{ username: string }>();
  const { token } = useAppAuth();

  const [member, setMember] = useState<ApiMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getMemberDetail(username, token)
      .then((res) => setMember(res.data))
      .catch((err) => setError(err.message || 'Profil tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [username, token]);

  if (loading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-12 px-4 max-w-4xl mx-auto space-y-4">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h1 className="text-xl font-bold text-slate-800">Profil Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500">{error || 'Anggota yang Anda cari mungkin belum aktif atau telah dinonaktifkan.'}</p>
          <Link
            to="/anggota"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1E36] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Direktori</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAlumni = member.memberType === 'alumni';
  const initial = member.fullName ? member.fullName.charAt(0).toUpperCase() : 'K';

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tombol Kembali */}
        <Link
          to="/anggota"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0F1E36] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Direktori Anggota</span>
        </Link>

        {/* Kartu Profil Utama */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-[#0F1E36] text-white flex items-center justify-center font-extrabold text-3xl shadow-md">
                {initial}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-[#0F172A]">{member.fullName}</h1>
                  <span
                    className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${
                      isAlumni
                        ? 'bg-amber-100 text-[#D97706]'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isAlumni ? 'Alumni' : 'Mahasiswa Aktif'}
                  </span>
                </div>
                <span className="text-sm text-slate-400">@{member.username}</span>
              </div>
            </div>

            {/* Tombol Kontak Cepat */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {member.whatsapp && (
                <a
                  href={`https://wa.me/${member.whatsapp.replace('+', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Grid Informasi Rinci */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Kolom Kiri: Pendidikan & Asal */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Pendidikan di Malang
                </h2>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-900">{member.universityName}</span>
                      <span className="text-xs text-slate-600">
                        {member.studyProgramName} • Angkatan {member.cohortYear}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Daerah Asal Kabupaten Pacitan
                </h2>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-900">
                        Kecamatan {member.districtName}
                      </span>
                      <span className="text-xs text-slate-600">
                        Desa / Kelurahan {member.villageName}
                      </span>
                    </div>
                  </div>

                  {/* Alamat Detail: UU PDP Restricted */}
                  {member.addressDetail ? (
                    <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-700">
                      <span className="block font-semibold text-slate-900 mb-0.5">Alamat Lengkap:</span>
                      <span>{member.addressDetail}</span>
                      <span className="block text-[10px] text-amber-600 mt-1">
                        (Hanya terlihat oleh Anda dan Pengurus Inti)
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Alamat detail dilindungi sesuai UU PDP No. 27/2022</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Karir Alumni & Media Sosial */}
            <div className="space-y-6">
              {isAlumni && member.alumni && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#D97706] mb-3">
                    Informasi Karir & Alumni
                  </h2>
                  <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold text-slate-900">
                          {member.alumni.jobTitle || 'Profesional / Praktisi'}
                        </span>
                        <span className="text-xs text-slate-600">
                          {member.alumni.organization || 'Wirausaha Mandiri'}
                        </span>
                      </div>
                    </div>

                    {member.alumni.industryName && (
                      <div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-semibold text-slate-700">Sektor Industri:</span>
                          <span className="text-xs text-slate-600">{member.alumni.industryName}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-600">
                      <span>Tahun Lulus: <strong>{member.alumni.graduationYear}</strong></span>
                      {member.alumni.workCity && <span>Kota: <strong>{member.alumni.workCity}</strong></span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Tautan Media Sosial */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Tautan Jejaring Sosial
                </h2>
                <div className="flex flex-col gap-2">
                  {member.linkedin ? (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Linkedin className="w-4 h-4 text-blue-600" />
                        <span>Profil LinkedIn</span>
                      </div>
                      <span className="text-[11px] text-blue-600 font-bold">Buka Profil &rarr;</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">LinkedIn belum ditambahkan</span>
                  )}

                  {member.instagram && (
                    <a
                      href={`https://instagram.com/${member.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl border border-slate-200 hover:border-pink-400 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <span>@{member.instagram}</span>
                      </div>
                      <span className="text-[11px] text-pink-600 font-bold">Instagram &rarr;</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
