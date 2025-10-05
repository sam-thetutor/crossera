'use client';

interface BlockchainStatusBadgeProps {
  status?: 'pending' | 'confirmed' | 'failed' | null;
  showIcon?: boolean;
}

export function BlockchainStatusBadge({ status, showIcon = true }: BlockchainStatusBadgeProps) {
  // Handle undefined/null status
  if (!status) {
    status = 'pending';
  }
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-green-500 bg-opacity-20',
          text: 'text-green-300',
          border: 'border-green-400 border-opacity-30',
          icon: '✓'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-500 bg-opacity-20',
          text: 'text-yellow-300',
          border: 'border-yellow-400 border-opacity-30',
          icon: '⏳'
        };
      case 'failed':
        return {
          bg: 'bg-red-500 bg-opacity-20',
          text: 'text-red-300',
          border: 'border-red-400 border-opacity-30',
          icon: '✗'
        };
      default:
        return {
          bg: 'bg-gray-500 bg-opacity-20',
          text: 'text-gray-300',
          border: 'border-gray-400 border-opacity-30',
          icon: '?'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${styles.bg} ${styles.text} ${styles.border}`}
    >
      {showIcon && <span className="mr-1">{styles.icon}</span>}
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
    </span>
  );
}

