import type { ReactNode } from 'react';

interface CardsCountViewProps {
  count: number;
  children: ReactNode;
}

export const CardsCountView = ({ count, children }: CardsCountViewProps) => {
  return (
    <button className="flex items-center gap-2">
      <div className="w-12 h-16 bg-gray-800 rounded-md flex items-center justify-center relative shadow-md">
        {children}
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {count}
        </div>
      </div>
    </button>
  );
};
