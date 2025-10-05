'use client';

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      DeFi: 'bg-blue-500 bg-opacity-20 text-blue-300 border-blue-400 border-opacity-30',
      NFT: 'bg-purple-500 bg-opacity-20 text-purple-300 border-purple-400 border-opacity-30',
      Gaming: 'bg-pink-500 bg-opacity-20 text-pink-300 border-pink-400 border-opacity-30',
      Metaverse: 'bg-indigo-500 bg-opacity-20 text-indigo-300 border-indigo-400 border-opacity-30',
      DAO: 'bg-green-500 bg-opacity-20 text-green-300 border-green-400 border-opacity-30',
      Infrastructure: 'bg-gray-500 bg-opacity-20 text-gray-300 border-gray-400 border-opacity-30',
      Other: 'bg-orange-500 bg-opacity-20 text-orange-300 border-orange-400 border-opacity-30'
    };
    return colors[cat] || colors.Other;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getCategoryColor(category)}`}
    >
      {category}
    </span>
  );
}

