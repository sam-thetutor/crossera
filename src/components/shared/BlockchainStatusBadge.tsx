'use client';

interface BlockchainStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'failed';
  showIcon?: boolean;
}

export function BlockchainStatusBadge({ status, showIcon = true }: BlockchainStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: '✓'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: '⏳'
        };
      case 'failed':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: '✗'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: '?'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles.bg} ${styles.text} ${styles.border}`}
    >
      {showIcon && <span className="mr-1">{styles.icon}</span>}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

