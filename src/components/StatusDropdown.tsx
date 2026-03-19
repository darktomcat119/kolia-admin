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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="px-3 py-1.5 text-sm font-body rounded-lg border border-border hover:bg-surface-hover transition-colors disabled:opacity-50"
      >
        Changer le statut
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-border py-1 min-w-[160px]">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(status);
                  setIsOpen(false);
                }}
                disabled={status === currentStatus}
                className={`w-full text-left px-4 py-2 text-sm font-body hover:bg-surface-hover transition-colors disabled:opacity-40 ${
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
