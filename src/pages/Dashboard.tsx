import { useEffect, useState } from 'react';
import { Package, DollarSign, Store, Clock } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { HeroCarousel } from '../components/HeroCarousel';
import { api } from '../lib/api';
import type { DashboardStats, Order } from '../lib/types';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        api.get<DashboardStats>('/api/admin/stats'),
        api.get<Order[]>('/api/admin/orders'),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 10));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel
        greeting={greeting}
        title="Tableau de bord"
        subtitle={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* Stats — staggered fade-up */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="animate-fade-up-1">
          <StatsCard
            icon={<Package size={21} />}
            label="Commandes aujourd'hui"
            value={stats?.orders_today ?? 0}
            color="orange"
          />
        </div>
        <div className="animate-fade-up-2">
          <StatsCard
            icon={<DollarSign size={21} />}
            label="Revenu aujourd'hui"
            value={`€${(stats?.revenue_today ?? 0).toFixed(2)}`}
            color="green"
          />
        </div>
        <div className="animate-fade-up-3">
          <StatsCard
            icon={<Store size={21} />}
            label="Restaurants actifs"
            value={stats?.active_restaurants ?? 0}
            color="blue"
          />
        </div>
        <div className="animate-fade-up-4">
          <StatsCard
            icon={<Clock size={21} />}
            label="Commandes en attente"
            value={stats?.pending_orders ?? 0}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-[#F0EDE8] animate-fade-up overflow-hidden" style={{ animationDelay: '0.5s' }}>
        {/* Table header */}
        <div className="px-7 py-5 border-b border-[#F0EDE8] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold font-body text-[#1A1A1A]">Commandes récentes</h2>
            <p className="text-[12px] text-[#9C9690] font-body mt-0.5">Suivi en temps réel de vos commandes</p>
          </div>
          <span className="text-[11px] text-[#9C9690] font-body font-medium bg-[#F5F3F0] px-3.5 py-1.5 rounded-full">
            {recentOrders.length} affichées
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5F3F0] to-[#EBE8E3] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package size={24} className="text-[#C4C0BB]" />
            </div>
            <p className="text-[#6B6560] font-body text-sm font-medium">Aucune commande pour le moment</p>
            <p className="text-[#B0ABA5] font-body text-xs mt-1">Les nouvelles commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#FAFAF7] to-[#F7F5F2]">
                  <th className="text-left px-7 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    N° commande
                  </th>
                  <th className="text-left px-7 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-7 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="text-left px-7 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-7 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left px-7 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {recentOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-gradient-to-r hover:from-[#FDFCFB] hover:to-[#FAF9F7] transition-all duration-200 cursor-pointer"
                    style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                  >
                    <td className="px-7 py-4.5 text-sm font-semibold font-body text-[#1A1A1A] group-hover:text-primary transition-colors duration-200">
                      <span className="bg-[#F5F3F0] group-hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors duration-200">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-7 py-4.5 text-sm font-body text-[#6B6560] group-hover:text-[#4A4540] transition-colors duration-200">
                      {order.profile?.full_name ?? 'Inconnu'}
                    </td>
                    <td className="px-7 py-4.5 text-sm font-body text-[#6B6560] group-hover:text-[#4A4540] transition-colors duration-200">
                      {order.restaurant?.name ?? 'Inconnu'}
                    </td>
                    <td className="px-7 py-4.5 text-sm font-body font-bold text-[#1A1A1A] tabular-nums">
                      <span className="text-[#1B5E3A]">€{Number(order.total).toFixed(2)}</span>
                    </td>
                    <td className="px-7 py-4.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-7 py-4.5 text-sm font-body text-[#9C9690] tabular-nums">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
