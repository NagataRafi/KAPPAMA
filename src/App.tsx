import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/public/HomePage';
import { ProfilPage } from './pages/public/ProfilPage';
import { VisiMisiPage } from './pages/public/VisiMisiPage';
import { StrukturPage } from './pages/public/StrukturPage';
import { AdArtPage } from './pages/public/AdArtPage';
import { ProgramKerjaPage } from './pages/public/ProgramKerjaPage';
import { ProgramKerjaDetailPage } from './pages/public/ProgramKerjaDetailPage';
import { GaleriPage } from './pages/public/GaleriPage';
import { GaleriDetailPage } from './pages/public/GaleriDetailPage';
import { DaftarPage } from './pages/public/DaftarPage';
import { KebijakanPrivasiPage } from './pages/public/KebijakanPrivasiPage';
import { SyaratPenggunaanPage } from './pages/public/SyaratPenggunaanPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Anggota & Auth Pages
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { StatusPage } from './pages/auth/StatusPage';
import { DirektoriPage } from './pages/members/DirektoriPage';
import { MemberDetailPage } from './pages/members/MemberDetailPage';
import { ProfilSayaPage } from './pages/members/ProfilSayaPage';
import { ApprovalsPage } from './pages/admin/ApprovalsPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ProfilOrganisasiPage } from './pages/admin/ProfilOrganisasiPage';
import { StrukturAdminPage } from './pages/admin/StrukturAdminPage';
import { AdArtAdminPage } from './pages/admin/AdArtAdminPage';
import { ProgramKerjaAdminPage } from './pages/admin/ProgramKerjaAdminPage';
import { ProgramKerjaFormPage } from './pages/admin/ProgramKerjaFormPage';
import { GaleriAdminPage } from './pages/admin/GaleriAdminPage';
import { GaleriFormPage } from './pages/admin/GaleriFormPage';
import { AuthGuard } from './components/auth/AuthGuard';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Halaman Publik */}
          <Route index element={<HomePage />} />
          <Route path="profil" element={<ProfilPage />} />
          <Route path="profil/visi-misi" element={<VisiMisiPage />} />
          <Route path="profil/struktur" element={<StrukturPage />} />
          <Route path="profil/ad-art" element={<AdArtPage />} />
          <Route path="program-kerja" element={<ProgramKerjaPage />} />
          <Route path="program-kerja/:slug" element={<ProgramKerjaDetailPage />} />
          <Route path="galeri" element={<GaleriPage />} />
          <Route path="galeri/:slug" element={<GaleriDetailPage />} />
          <Route path="daftar" element={<DaftarPage />} />
          <Route path="kebijakan-privasi" element={<KebijakanPrivasiPage />} />
          <Route path="syarat-penggunaan" element={<SyaratPenggunaanPage />} />

          {/* Onboarding & Status */}
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="status" element={<StatusPage />} />

          {/* Halaman Khusus Anggota Terverifikasi (Status Aktif) */}
          <Route
            path="anggota"
            element={
              <AuthGuard requireActive={true}>
                <DirektoriPage />
              </AuthGuard>
            }
          />
          <Route
            path="anggota/:username"
            element={
              <AuthGuard requireActive={true}>
                <MemberDetailPage />
              </AuthGuard>
            }
          />
          <Route
            path="profil-saya"
            element={
              <AuthGuard requireActive={true}>
                <ProfilSayaPage />
              </AuthGuard>
            }
          />

          {/* Halaman Admin */}
          <Route
            path="admin"
            element={
              <AuthGuard requireActive={true}>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="persetujuan" element={<ApprovalsPage />} />
            <Route path="program-kerja" element={<ProgramKerjaAdminPage />} />
            <Route path="program-kerja/:id" element={<ProgramKerjaFormPage />} />
            <Route path="galeri" element={<GaleriAdminPage />} />
            <Route path="galeri/:id" element={<GaleriFormPage />} />
            <Route path="profil-organisasi" element={<ProfilOrganisasiPage />} />
            <Route path="struktur" element={<StrukturAdminPage />} />
            <Route path="ad-art" element={<AdArtAdminPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
