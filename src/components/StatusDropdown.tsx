import { useState } from 'react';
import type { OrderStatus } from '../lib/types';
import { ORDER_STATUS_LABELS } from '../lib/types';

const STATUSES: OrderStatus[] = [
  'received',
  'preparing',
  'ready',
  'on_the_way',
  'completed',
  'cancelled',
];

interface StatusDropdownProps {
  currentStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  disabled?: boolean;
}

export function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="min-h-[40px] whitespace-nowrap rounded-lg border border-border px-3 py-2 font-body text-xs transition-colors hover:bg-surface-hover disabled:opacity-50 sm:min-h-0 sm:py-1.5 sm:text-sm"
      >
        Changer le statut
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} role="presentation" />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[min(50vh,320px)] overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-lg sm:left-auto sm:right-0 sm:min-w-[180px]">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onStatusChange(status);
                  setIsOpen(false);
                }}
                disabled={status === currentStatus}
                className={`min-h-[44px] w-full px-4 py-2.5 text-left font-body text-sm transition-colors hover:bg-surface-hover disabled:opacity-40 sm:min-h-0 sm:py-2 ${
                  status === currentStatus ? 'text-primary font-medium' : 'text-[#1A1A1A]'
                }`}
              >
                {ORDER_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
