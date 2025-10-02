'use client';

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      DeFi: 'bg-blue-100 text-blue-800 border-blue-200',
      NFT: 'bg-purple-100 text-purple-800 border-purple-200',
      Gaming: 'bg-pink-100 text-pink-800 border-pink-200',
      Metaverse: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      DAO: 'bg-green-100 text-green-800 border-green-200',
      Infrastructure: 'bg-gray-100 text-gray-800 border-gray-200',
      Other: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[cat] || colors.Other;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}
    >
      {category}
    </span>
  );
}

