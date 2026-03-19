import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { api } from '../lib/api';
import type { Order, OrderStatus } from '../lib/types';
import { ORDER_STATUS_LABELS } from '../lib/types';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { StatusDropdown } from '../components/StatusDropdown';
import { OrderDetailModal } from '../components/OrderDetailModal';

const STATUS_FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'received',
  'preparing',
  'ready',
  'on_the_way',
  'completed',
  'cancelled',
];

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  const fetchOrders = async () => {
    try {
      const data = await api.get<Order[]>('/api/admin/orders');
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      showToast(`Statut mis à jour : ${ORDER_STATUS_LABELS[status]}`);
    } catch {
      showToast('Échec de la mise à jour du statut', 'error');
    }
  };

  const filtered =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-semibold font-body text-[#1A1A1A]">Commandes</h1>
          <p className="text-sm text-[#9C9690] font-body mt-0.5">{orders.length} commande(s) au total</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {STATUS_FILTERS.map((status) => {
          const count = status !== 'all' ? orders.filter((o) => o.status === status).length : orders.length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all flex items-center gap-1.5 ${
                filter === status
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-white border border-[#E5E3E0] text-[#6B6560] hover:border-primary/30 hover:text-[#1A1A1A]'
              }`}
            >
              {status === 'all' ? 'Toutes' : ORDER_STATUS_LABELS[status]}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  filter === status ? 'bg-white/20 text-white' : 'bg-[#F5F3F0] text-[#9C9690]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-border-light animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F3F0] flex items-center justify-center mx-auto mb-3">
              <Package size={22} className="text-[#C4C0BB]" />
            </div>
            <p className="text-[#6B6560] font-body text-sm">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light bg-[#FAFAF7]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    N° commande
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    Client
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    Restaurant
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    Articles
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    Total
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#9C9690] font-body uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-light last:border-0 hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-4 text-sm font-semibold font-body text-[#1A1A1A]">
                      {order.order_number}
                    </td>
                    <td className="px-5 py-4 text-sm font-body text-[#6B6560]">
                      {order.profile?.full_name ?? 'Inconnu'}
                    </td>
                    <td className="px-5 py-4 text-sm font-body text-[#6B6560]">
                      {order.restaurant?.name ?? 'Inconnu'}
                    </td>
                    <td className="px-5 py-4 text-sm font-body text-[#6B6560]">
                      {order.order_items?.length ?? 0} article(s)
                    </td>
                    <td className="px-5 py-4 text-sm font-body font-semibold text-[#1A1A1A]">
                      €{Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-sm font-body text-[#9C9690]">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        currentStatus={order.status}
                        onStatusChange={(status) => handleStatusChange(order.id, status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
