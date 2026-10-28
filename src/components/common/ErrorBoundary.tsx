import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Menangkap galat render agar pengguna tidak melihat layar putih. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Tanpa data pribadi: hanya nama komponen dan pesan galat.
    console.error('Render error:', error.message, errorInfo.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <h1 className="text-xl font-extrabold text-[#0F1E36]">Terjadi Kesalahan</h1>
          <p className="text-sm text-slate-600">
            Halaman gagal ditampilkan. Silakan muat ulang halaman ini.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#0F1E36] text-white text-sm font-bold hover:bg-[#1a2f52] transition-colors"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }
}
