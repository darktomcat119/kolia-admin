import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, UtensilsCrossed, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { path: string; label: string; icon: LucideIcon; description: string }[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, description: 'Vue d\'ensemble' },
  { path: '/orders', label: 'Commandes', icon: Package, description: 'Gérer les commandes' },
  { path: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed, description: 'Gérer les établissements' },
];

export function Sidebar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const email = session?.user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : 'AD';

  return (
    <aside className="w-[260px] bg-gradient-to-b from-[#0D0D0D] via-[#111111] to-[#0A0A0A] text-white flex flex-col min-h-screen border-r border-white/[0.06] shadow-2xl">
      {/* Logo */}
      <div className="p-7 pb-6">
        <div className="flex flex-col gap-1.5">
          <img src="/images/logo.png" alt="Kolia" className="h-12 w-auto object-contain object-left" />
          <p className="font-body text-[10px] text-white/25 uppercase tracking-[0.2em] ml-0.5">Administration</p>
        </div>
      </div>

      {/* Decorative line */}
      <div className="mx-5 mb-5">
        <div className="h-px bg-gradient-to-r from-primary/40 via-white/[0.06] to-transparent" />
      </div>

      {/* Nav label */}
      <div className="px-5 pb-3">
        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.2em] font-body">Navigation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon, description }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-body transition-all duration-300 ease-out ${
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-white'
                  : 'text-white/35 hover:text-white/80 hover:bg-white/[0.04] hover:translate-x-0.5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left border indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-r-full shadow-[0_0_12px_rgba(224,122,47,0.4)]" />
                )}
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/20 shadow-sm'
                    : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                }`}>
                  <Icon size={16} className={`transition-all duration-300 ${isActive ? 'text-primary' : 'text-white/35 group-hover:text-white/60'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`block text-[13px] font-medium leading-tight ${isActive ? 'text-white' : ''}`}>{label}</span>
                  <span className={`block text-[10px] mt-0.5 transition-all duration-300 ${
                    isActive ? 'text-white/40' : 'text-white/15 group-hover:text-white/30'
                  }`}>{description}</span>
                </div>
                <ChevronRight size={13} className={`transition-all duration-300 ${
                  isActive ? 'text-primary/60 opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                }`} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-5 my-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* User */}
      <div className="px-4 pb-6">
        {/* Avatar row */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-[#D06A1F] to-[#B85A10] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 ring-2 ring-primary/10">
            <span className="text-white font-body font-semibold text-[11px]">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white/75 text-xs font-body font-medium truncate">{email}</p>
            <p className="text-white/25 text-[10px] font-body mt-0.5">Administrateur</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-300 text-xs font-body group"
        >
          <LogOut size={14} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
