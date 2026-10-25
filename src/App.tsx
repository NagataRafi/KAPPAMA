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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
