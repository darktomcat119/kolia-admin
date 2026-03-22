import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, UtensilsCrossed, LogOut, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { path: string; label: string; icon: LucideIcon; description: string }[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, description: "Vue d'ensemble" },
  { path: '/orders', label: 'Commandes', icon: Package, description: 'Gérer les commandes' },
  { path: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed, description: 'Gérer les établissements' },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    onCloseMobile?.();
    await signOut();
    navigate('/login');
  };

  const email = session?.user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : 'AD';

  const linkClick = () => onCloseMobile?.();

  const asideClass =
    'fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] max-w-[280px] flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#0D0D0D] via-[#111111] to-[#0A0A0A] text-white shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:max-w-none lg:w-[260px] lg:translate-x-0 ' +
    (mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0');

  return (
    <aside className={asideClass}>
      <div className="relative flex max-h-screen min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <button
          type="button"
          onClick={() => onCloseMobile?.()}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 lg:hidden hover:bg-white/10"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>

        <div className="p-6 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:p-7 lg:pb-6 lg:pt-7">
          <div className="flex flex-col gap-1.5 pr-10 lg:pr-0">
            <img src="/images/logo.png" alt="Kolia" className="h-10 w-auto object-contain object-left lg:h-12" />
            <p className="ml-0.5 font-body text-[10px] uppercase tracking-[0.2em] text-white/25">Administration</p>
          </div>
        </div>

        <div className="mx-5 mb-5">
          <div className="h-px bg-gradient-to-r from-primary/40 via-white/[0.06] to-transparent" />
        </div>

        <div className="px-5 pb-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">Navigation</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-4">
          {NAV_ITEMS.map(({ path, label, icon: Icon, description }) => (
            <NavLink
              key={path}
              to={path}
              onClick={linkClick}
              className={({ isActive }) =>
                `group relative flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-body transition-all duration-300 ease-out ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-white'
                    : 'text-white/35 hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-white/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_rgba(224,122,47,0.4)]" />
                  )}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                      isActive ? 'bg-primary/20 shadow-sm' : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon size={16} className={`transition-all duration-300 ${isActive ? 'text-primary' : 'text-white/35 group-hover:text-white/60'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`block text-[13px] font-medium leading-tight ${isActive ? 'text-white' : ''}`}>{label}</span>
                    <span
                      className={`mt-0.5 block text-[10px] transition-all duration-300 ${
                        isActive ? 'text-white/40' : 'text-white/15 group-hover:text-white/30'
                      }`}
                    >
                      {description}
                    </span>
                  </div>
                  <ChevronRight
                    size={13}
                    className={`shrink-0 transition-all duration-300 ${
                      isActive ? 'text-primary/60 opacity-100' : 'text-white/20 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-5 my-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <div className="mt-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary via-[#D06A1F] to-[#B85A10] shadow-lg shadow-primary/20 ring-2 ring-primary/10">
              <span className="font-body text-[11px] font-semibold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-xs font-medium text-white/75">{email}</p>
              <p className="mt-0.5 font-body text-[10px] text-white/25">Administrateur</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="group flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-4 py-2.5 font-body text-xs text-white/30 transition-all duration-300 hover:bg-red-500/[0.06] hover:text-red-400"
          >
            <LogOut size={14} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
