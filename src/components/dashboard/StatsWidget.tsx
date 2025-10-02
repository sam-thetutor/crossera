'use client';

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

function StatItem({ label, value, icon, color = 'blue' }: StatItemProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-2xl`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsWidgetProps {
  totalProjects: number;
  activeProjects: number;
  totalRewards: string;
  totalTransactions: number;
}

export function StatsWidget({
  totalProjects,
  activeProjects,
  totalRewards,
  totalTransactions
}: StatsWidgetProps) {
  const formatRewards = (rewards: string) => {
    const num = parseFloat(rewards);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatItem
        label="Total Projects"
        value={totalProjects}
        icon="📁"
        color="blue"
      />
      <StatItem
        label="Active Projects"
        value={activeProjects}
        icon="✓"
        color="green"
      />
      <StatItem
        label="Total Rewards"
        value={`${formatRewards(totalRewards)} XFI`}
        icon="💰"
        color="purple"
      />
      <StatItem
        label="Transactions"
        value={totalTransactions}
        icon="📊"
        color="orange"
      />
    </div>
  );
}

