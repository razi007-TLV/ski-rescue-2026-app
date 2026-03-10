'use client';

import { Settlement } from '@/types';
import { formatCurrency, toNIS, formatNIS } from '@/lib/utils';

interface SettlementListProps {
  settlements: Settlement[];
  onDeleteSettlement: (id: string) => void;
}

export default function SettlementList({ settlements, onDeleteSettlement }: SettlementListProps) {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No settlements recorded yet.
      </div>
    );
  }

  const sortedSettlements = [...settlements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Settlement History
      </h3>
      {sortedSettlements.map((settlement) => (
        <div
          key={settlement.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-green-50 dark:bg-green-900/10"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-gray-800 dark:text-gray-200">
                <span className="font-semibold">{settlement.from_member}</span>
                {' → '}
                <span className="font-semibold">{settlement.to_member}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(settlement.date).toLocaleDateString()}
              </p>
              {settlement.note && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {settlement.note}
                </p>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(settlement.amount, settlement.currency)}
              </p>
              {settlement.currency !== 'NIS' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatNIS(toNIS(settlement.amount, settlement.currency))}
                </p>
              )}
              <button
                onClick={() => onDeleteSettlement(settlement.id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-2 text-sm"
                aria-label="Delete settlement"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
