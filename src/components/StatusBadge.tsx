import type { OrderStatus } from '../lib/types';
import { ORDER_STATUS_LABELS } from '../lib/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  received: 'bg-[#FDF0E4] text-primary',
  preparing: 'bg-[#FEF5E4] text-[#F59E0B]',
  ready: 'bg-[#E8EFFE] text-[#2563EB]',
  on_the_way: 'bg-[#E8EFFE] text-[#2563EB]',
  completed: 'bg-[#E8F9EE] text-[#16A34A]',
  cancelled: 'bg-[#FDE8E8] text-[#DC2626]',
};

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium font-body ${STATUS_COLORS[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
