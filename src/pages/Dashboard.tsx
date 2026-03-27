import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, DollarSign, Store, Clock } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { HeroCarousel } from '../components/HeroCarousel';
import { api } from '../lib/api';
import type { DashboardStats, Order } from '../lib/types';
import { supabase } from '../lib/supabase';

type ReviewMetricRow = {
  rating: number;
  is_approved: boolean;
  created_at: string;
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [reviewMetrics, setReviewMetrics] = useState({
    approvedCount: 0,
    hiddenCount: 0,
    avgApproved: 0,
    last7Days: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, ordersData, reviewsRes] = await Promise.all([
        api.get<DashboardStats>('/api/admin/stats'),
        api.get<Order[]>('/api/admin/orders'),
        supabase
          .from('restaurant_reviews')
          .select('rating, is_approved, created_at')
          .limit(5000),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 10));
      if (reviewsRes.error) throw reviewsRes.error;

      const reviews = (reviewsRes.data ?? []) as ReviewMetricRow[];
      const approved = reviews.filter((r) => r.is_approved);
      const hidden = reviews.length - approved.length;
      const approvedAvg = approved.length
        ? approved.reduce((sum, r) => sum + Number(r.rating || 0), 0) / approved.length
        : 0;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const last7Days = reviews.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo).length;
      setReviewMetrics({
        approvedCount: approved.length,
        hiddenCount: hidden,
        avgApproved: Number(approvedAvg.toFixed(2)),
        last7Days,
      });
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
      <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Review analytics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/reviews?filter=approved" className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9C9690]">Note moyenne</p>
          <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">★ {reviewMetrics.avgApproved.toFixed(2)}</p>
          <p className="mt-1 text-xs text-[#9C9690]">Avis approuvés · Voir détails</p>
        </Link>
        <Link to="/reviews?filter=approved" className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9C9690]">Avis approuvés</p>
          <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">{reviewMetrics.approvedCount}</p>
          <p className="mt-1 text-xs text-[#9C9690]">Visibles dans l&apos;app client · Voir détails</p>
        </Link>
        <Link to="/reviews?filter=hidden" className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9C9690]">Avis masqués</p>
          <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">{reviewMetrics.hiddenCount}</p>
          <p className="mt-1 text-xs text-[#9C9690]">Non pris en compte dans la note · Voir détails</p>
        </Link>
        <Link to="/reviews?filter=all" className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9C9690]">Nouveaux avis (7j)</p>
          <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">{reviewMetrics.last7Days}</p>
          <p className="mt-1 text-xs text-[#9C9690]">Toutes modérations confondues · Voir détails</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-[#F0EDE8] animate-fade-up overflow-hidden" style={{ animationDelay: '0.5s' }}>
        {/* Table header */}
        <div className="flex flex-col gap-3 border-b border-[#F0EDE8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2 className="font-body text-base font-semibold text-[#1A1A1A] sm:text-lg">Commandes récentes</h2>
            <p className="mt-0.5 font-body text-[11px] text-[#9C9690] sm:text-[12px]">Suivi en temps réel de vos commandes</p>
          </div>
          <span className="w-fit shrink-0 rounded-full bg-[#F5F3F0] px-3.5 py-1.5 font-body text-[11px] font-medium text-[#9C9690]">
            {recentOrders.length} affichées
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-4 py-12 text-center sm:p-20">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5F3F0] to-[#EBE8E3] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package size={24} className="text-[#C4C0BB]" />
            </div>
            <p className="text-[#6B6560] font-body text-sm font-medium">Aucune commande pour le moment</p>
            <p className="text-[#B0ABA5] font-body text-xs mt-1">Les nouvelles commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#FAFAF7] to-[#F7F5F2]">
                  <th className="px-3 py-3 text-left font-body text-[10px] font-semibold uppercase tracking-wider text-[#9C9690] sm:px-7 sm:py-4 sm:text-[11px]">
                    N° commande
                  </th>
                  <th className="px-3 py-3 text-left font-body text-[10px] font-semibold uppercase tracking-wider text-[#9C9690] sm:px-7 sm:py-4 sm:text-[11px]">
                    Client
                  </th>
                  <th className="px-3 py-3 text-left font-body text-[10px] font-semibold uppercase tracking-wider text-[#9C9690] sm:px-7 sm:py-4 sm:text-[11px]">
                    Restaurant
                  </th>
                  <th className="px-3 py-3 text-left font-body text-[10px] font-semibold uppercase tracking-wider text-[#9C9690] sm:px-7 sm:py-4 sm:text-[11px]">
                    Total
                  </th>
                  <th className="px-3 py-3 text-left font-body text-[10px] font-semibold uppercase tracking-wider text-[#9C9690] sm:px-7 sm:py-4 sm:text-[11px]">
                    Statut
                  </th>
                  <th className="px-3 py-3 text-left font-body text-[10px] font-semibold uppercase tracking-wider text-[#9C9690] sm:px-7 sm:py-4 sm:text-[11px]">
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
                    <td className="px-3 py-3 font-body text-xs font-semibold text-[#1A1A1A] transition-colors duration-200 group-hover:text-primary sm:px-7 sm:py-4.5 sm:text-sm">
                      <span className="rounded-lg bg-[#F5F3F0] px-2 py-1 transition-colors duration-200 group-hover:bg-primary/10 sm:px-2.5">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-3 font-body text-xs text-[#6B6560] transition-colors duration-200 group-hover:text-[#4A4540] sm:max-w-none sm:px-7 sm:py-4.5 sm:text-sm">
                      {order.profile?.full_name ?? 'Inconnu'}
                    </td>
                    <td className="max-w-[130px] truncate px-3 py-3 font-body text-xs text-[#6B6560] transition-colors duration-200 group-hover:text-[#4A4540] sm:max-w-none sm:px-7 sm:py-4.5 sm:text-sm">
                      {order.restaurant?.name ?? 'Inconnu'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-body text-xs font-bold tabular-nums text-[#1A1A1A] sm:px-7 sm:py-4.5 sm:text-sm">
                      <span className="text-[#1B5E3A]">€{Number(order.total).toFixed(2)}</span>
                    </td>
                    <td className="px-3 py-3 sm:px-7 sm:py-4.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-body text-xs tabular-nums text-[#9C9690] sm:px-7 sm:py-4.5 sm:text-sm">
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
