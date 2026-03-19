import type { Order } from '../lib/types';
import { StatusBadge } from './StatusBadge';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <div>
            <h2 className="text-lg font-semibold font-body">
              Commande {order.order_number}
            </h2>
            <p className="text-sm text-[#6B6560] font-body mt-1">
              {new Date(order.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Customer */}
        <div className="p-6 border-b border-border-light">
          <h3 className="text-sm font-medium text-[#6B6560] font-body mb-2">Client</h3>
          <p className="font-body text-sm">{order.profile?.full_name ?? 'Inconnu'}</p>
          <p className="font-body text-sm text-[#6B6560]">{order.profile?.email}</p>
          {order.profile?.phone && (
            <p className="font-body text-sm text-[#6B6560]">{order.profile.phone}</p>
          )}
        </div>

        {/* Restaurant */}
        <div className="p-6 border-b border-border-light">
          <h3 className="text-sm font-medium text-[#6B6560] font-body mb-2">Restaurant</h3>
          <p className="font-body text-sm">{order.restaurant?.name ?? 'Inconnu'}</p>
          <p className="font-body text-sm text-[#6B6560] capitalize">
            {order.order_type} {order.delivery_address && `· ${order.delivery_address}`}
          </p>
        </div>

        {/* Items */}
        <div className="p-6 border-b border-border-light">
          <h3 className="text-sm font-medium text-[#6B6560] font-body mb-3">Articles</h3>
          <div className="space-y-2">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm font-body">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="text-[#6B6560]">
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="p-6 border-b border-border-light space-y-2">
          <div className="flex justify-between text-sm font-body">
            <span className="text-[#6B6560]">Sous-total</span>
            <span>€{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-body">
            <span className="text-[#6B6560]">Frais de livraison</span>
            <span>€{Number(order.delivery_fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold font-body pt-2 border-t border-border-light">
            <span>Total</span>
            <span>€{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-6 border-b border-border-light">
            <h3 className="text-sm font-medium text-[#6B6560] font-body mb-2">Notes</h3>
            <p className="text-sm font-body text-[#1A1A1A]">{order.notes}</p>
          </div>
        )}

        {/* Close */}
        <div className="p-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-border text-sm font-body font-medium hover:bg-surface-hover transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
