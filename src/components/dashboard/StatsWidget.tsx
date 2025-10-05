'use client';

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

function StatItem({ label, value, icon, color = 'blue' }: StatItemProps) {
  const colorClasses = {
    blue: 'bg-blue-500 bg-opacity-20 text-blue-300',
    green: 'bg-green-500 bg-opacity-20 text-green-300',
    purple: 'bg-purple-500 bg-opacity-20 text-purple-300',
    orange: 'bg-orange-500 bg-opacity-20 text-orange-300'
  };

  return (
    <div className="glass-card rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-300 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-2xl backdrop-blur-sm`}>
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
  totalUniqueUsers?: number;
}

export function StatsWidget({
  totalProjects,
  activeProjects,
  totalRewards,
  totalTransactions,
  totalUniqueUsers = 0
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
        label="Unique Users"
        value={totalUniqueUsers.toLocaleString()}
        icon="👥"
        color="purple"
      />
      <StatItem
        label="Total Rewards"
        value={`${formatRewards(totalRewards)} XFI`}
        icon="💰"
        color="orange"
      />
      <StatItem
        label="Transactions"
        value={totalTransactions}
        icon="📊"
        color="blue"
      />
    </div>
  );
}

