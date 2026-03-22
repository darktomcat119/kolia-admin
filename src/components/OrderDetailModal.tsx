import type { Order } from '../lib/types';
import { StatusBadge } from './StatusBadge';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} role="presentation" />
      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:mx-4 sm:max-h-[85dvh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border-light p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2 className="font-body text-base font-semibold sm:text-lg">
              Commande {order.order_number}
            </h2>
            <p className="mt-1 font-body text-xs text-[#6B6560] sm:text-sm">
              {new Date(order.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="shrink-0 self-start sm:self-auto">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain">
        {/* Customer */}
        <div className="border-b border-border-light p-4 sm:p-6">
          <h3 className="text-sm font-medium text-[#6B6560] font-body mb-2">Client</h3>
          <p className="font-body text-sm">{order.profile?.full_name ?? 'Inconnu'}</p>
          <p className="font-body text-sm text-[#6B6560]">{order.profile?.email}</p>
          {order.profile?.phone && (
            <p className="font-body text-sm text-[#6B6560]">{order.profile.phone}</p>
          )}
        </div>

        {/* Restaurant */}
        <div className="border-b border-border-light p-4 sm:p-6">
          <h3 className="text-sm font-medium text-[#6B6560] font-body mb-2">Restaurant</h3>
          <p className="font-body text-sm">{order.restaurant?.name ?? 'Inconnu'}</p>
          <p className="break-words font-body text-sm capitalize text-[#6B6560]">
            {order.order_type} {order.delivery_address && `· ${order.delivery_address}`}
          </p>
        </div>

        {/* Items */}
        <div className="border-b border-border-light p-4 sm:p-6">
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
        <div className="space-y-2 border-b border-border-light p-4 sm:p-6">
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
          <div className="border-b border-border-light p-4 sm:p-6">
            <h3 className="text-sm font-medium text-[#6B6560] font-body mb-2">Notes</h3>
            <p className="text-sm font-body text-[#1A1A1A]">{order.notes}</p>
          </div>
        )}
        </div>

        {/* Close */}
        <div className="border-t border-border-light bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full rounded-xl border border-border py-2.5 font-body text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
