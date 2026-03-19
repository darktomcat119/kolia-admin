import type { ReactNode } from 'react';

type ColorVariant = 'orange' | 'green' | 'blue' | 'purple';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: ColorVariant;
  trend?: string;
}

const COLOR_MAP: Record<ColorVariant, {
  bg: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  glow: string;
  border: string;
}> = {
  orange: {
    bg: 'bg-gradient-to-br from-[#FFF8F2] via-[#FFF1E4] to-[#FFE4CC]',
    iconBg: 'bg-gradient-to-br from-[#E07A2F] to-[#C96820]',
    iconColor: 'text-white',
    badge: 'text-[#E07A2F]',
    glow: 'shadow-[0_8px_32px_-4px_rgba(224,122,47,0.15)]',
    border: 'border-[#E07A2F]/10',
  },
  green: {
    bg: 'bg-gradient-to-br from-[#F2FBF6] via-[#E8F8EF] to-[#D0F0DE]',
    iconBg: 'bg-gradient-to-br from-[#1B5E3A] to-[#14472C]',
    iconColor: 'text-white',
    badge: 'text-[#1B5E3A]',
    glow: 'shadow-[0_8px_32px_-4px_rgba(27,94,58,0.12)]',
    border: 'border-[#1B5E3A]/10',
  },
  blue: {
    bg: 'bg-gradient-to-br from-[#F0F5FF] via-[#E6EEFF] to-[#D4E3FF]',
    iconBg: 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB]',
    iconColor: 'text-white',
    badge: 'text-[#3B82F6]',
    glow: 'shadow-[0_8px_32px_-4px_rgba(59,130,246,0.12)]',
    border: 'border-[#3B82F6]/10',
  },
  purple: {
    bg: 'bg-gradient-to-br from-[#F7F3FF] via-[#F0EAFF] to-[#E4D9FF]',
    iconBg: 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]',
    iconColor: 'text-white',
    badge: 'text-[#7C3AED]',
    glow: 'shadow-[0_8px_32px_-4px_rgba(124,58,237,0.12)]',
    border: 'border-[#7C3AED]/10',
  },
};

export function StatsCard({ label, value, icon, color = 'orange', trend }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div
      className={`${c.bg} rounded-2xl p-6 border ${c.border} ${c.glow} backdrop-blur-sm hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ease-out cursor-default group`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-body font-semibold ${c.badge} bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-[34px] font-bold font-body text-[#1A1A1A] mb-1.5 leading-none tracking-tight">
        {value}
      </div>
      <div className="text-[13px] text-[#8A857F] font-body mt-1.5 leading-snug font-medium">{label}</div>
    </div>
  );
}
