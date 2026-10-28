import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { isClerkConfigured } from '../../config/env';

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#D97706]/20 selection:text-[#0F1E36]">
      <Navbar />
      {!isClerkConfigured && (
        <p
          role="status"
          className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs sm:text-sm text-amber-800"
        >
          Konfigurasi login belum lengkap. Halaman publik tetap dapat dibaca, tetapi pendaftaran
          dan direktori anggota belum aktif.
        </p>
      )}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
