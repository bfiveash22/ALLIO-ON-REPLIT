import { Database, CheckCircle2, ShoppingBag, Zap } from 'lucide-react';

interface DataSourceBadgeProps {
  source?: 'postgresql' | 'woocommerce' | 'api';
  className?: string;
  id?: string;
}

const sourceConfig = {
  postgresql: {
    label: 'PostgreSQL',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Icon: Database,
  },
  woocommerce: {
    label: 'WooCommerce',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    Icon: ShoppingBag,
  },
  api: {
    label: 'Live API',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Icon: Zap,
  },
};

export function DataSourceBadge({ source = 'postgresql', className = '', id }: DataSourceBadgeProps) {
  const config = sourceConfig[source];
  const Icon = config.Icon;

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.color} ${className}`}
      title={`Real data from ${config.label}`}
      data-testid={id ? `data-source-badge-${id}` : 'data-source-badge'}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      <CheckCircle2 className="w-3 h-3" />
    </div>
  );
}
