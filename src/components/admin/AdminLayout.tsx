import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Images,
  Building2,
  Users,
  FileText,
  Menu,
  X,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useAppAuth } from '../auth/AuthContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/persetujuan', label: 'Persetujuan Anggota', icon: Clock },
  { to: '/admin/program-kerja', label: 'Program Kerja', icon: CalendarDays },
  { to: '/admin/galeri', label: 'Galeri & Album', icon: Images },
  { to: '/admin/profil-organisasi', label: 'Profil Organisasi', icon: Building2 },
  { to: '/admin/struktur', label: 'Struktur & Periode', icon: Users },
  { to: '/admin/ad-art', label: 'AD/ART', icon: FileText },
];

const LABELS: Record<string, string> = {
  admin: 'Panel Pengurus',
  persetujuan: 'Persetujuan Anggota',
  'program-kerja': 'Program Kerja',
  galeri: 'Galeri',
  'profil-organisasi': 'Profil Organisasi',
  struktur: 'Struktur & Periode',
  'ad-art': 'AD/ART',
};

export function AdminLayout() {
  const { role, isLoadingProfile } = useAppAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = role === 'super_admin' || role === 'content_admin';

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-md py-20 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900">Akses Ditolak</h1>
          <p className="text-xs text-slate-600">
            Panel pengurus hanya dapat diakses oleh Admin Konten dan Super Admin KAPPAMA.
          </p>
          <Link to="/" className="inline-block text-xs font-bold text-[#D97706] hover:underline">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: LABELS[segment] ?? (segment.length > 20 ? 'Detail' : segment),
    to: `/${segments.slice(0, index + 1).join('/')}`,
  }));

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Header mobile */}
      <div className="lg:hidden bg-[#0F1E36] text-white px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-sm">Panel Pengurus KAPPAMA</span>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Tutup menu pengurus' : 'Buka menu pengurus'}
          aria-expanded={menuOpen}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            menuOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-64 shrink-0 bg-[#0F1E36] text-white lg:min-h-[calc(100vh-5rem)]`}
        >
          <div className="hidden lg:block px-5 py-6 border-b border-slate-700/60">
            <span className="block text-[11px] uppercase tracking-widest text-amber-400 font-extrabold">
              Panel Pengurus
            </span>
            <span className="block text-lg font-extrabold">KAPPAMA</span>
          </div>
          <nav aria-label="Navigasi panel pengurus" className="p-3 space-y-1">
            {MENU.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#D97706] text-white shadow-sm'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3.5 py-2.5 mt-4 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700/70 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Kembali ke Situs</span>
            </Link>
          </nav>
        </aside>

        {/* Konten */}
        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-8 pt-6">
            <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
              <ol className="flex flex-wrap items-center gap-1.5">
                {crumbs.map((crumb, index) => (
                  <li key={crumb.to} className="flex items-center gap-1.5">
                    {index > 0 && <span aria-hidden="true">/</span>}
                    {index === crumbs.length - 1 ? (
                      <span aria-current="page" className="font-semibold text-slate-700">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link to={crumb.to} className="hover:text-[#D97706]">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className="px-4 sm:px-8 py-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
