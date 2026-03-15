'use client';

import { Balance, Currency } from '@/types';
import { formatAmount } from '@/lib/utils';

interface BalancesSummaryProps {
  balances: Balance[];
  displayCurrency?: Currency;
}

export default function BalancesSummary({ balances, displayCurrency = 'NIS' }: BalancesSummaryProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Current Balances
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {balances.map((balance) => (
          <div
            key={balance.member}
            className={`p-3 sm:p-4 rounded-lg border-2 ${
              balance.net > 0
                ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                : balance.net < 0
                ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700'
                : 'bg-gray-50 border-gray-300 dark:bg-gray-700/50 dark:border-gray-600'
            }`}
          >
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              {balance.member}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {formatAmount(balance.paid, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Owes:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {formatAmount(balance.owes, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Net:</span>
                <span
                  className={`font-bold ${
                    balance.net > 0
                      ? 'text-green-600 dark:text-green-400'
                      : balance.net < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {balance.net > 0 ? '+' : ''}{formatAmount(balance.net, displayCurrency)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
