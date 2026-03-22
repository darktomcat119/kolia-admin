import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F8F7F5]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer le menu"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          mobileNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileNavOpen(false)}
      />

      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header
          className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8E6E3] bg-white px-4 py-3 lg:hidden"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E5E3E0] text-[#1A1A1A] transition-colors hover:bg-[#F5F3F0] active:scale-[0.98]"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <img src="/images/logo.png" alt="Kolia" className="h-8 w-auto max-w-[140px] object-contain object-center" />
          <span className="h-11 w-11 shrink-0" aria-hidden />
        </header>

        <main className="min-h-0 flex-1 overflow-auto overscroll-y-contain">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
