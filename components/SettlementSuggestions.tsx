'use client';

import { SimplifiedDebt } from '@/types';
import { formatNIS } from '@/lib/utils';

interface SettlementSuggestionsProps {
  debts: SimplifiedDebt[];
}

export default function SettlementSuggestions({ debts }: SettlementSuggestionsProps) {
  if (debts.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-6 text-center">
        <p className="text-green-700 dark:text-green-300 font-semibold text-lg">
          ✅ All settled up! No outstanding debts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Settlement Suggestions
      </h2>
      <div className="space-y-3">
        {debts.map((debt, index) => (
          <div
            key={index}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4"
          >
            <p className="text-gray-800 dark:text-gray-200">
              <span className="font-semibold">{debt.from}</span>
              {' '}should pay{' '}
              <span className="font-semibold">{debt.to}</span>
              {' '}
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                {formatNIS(debt.amount)}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
