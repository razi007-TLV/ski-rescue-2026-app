'use client';

import { Expense } from '@/types';
import { formatCurrency, toNIS, formatNIS } from '@/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

export default function ExpenseList({ expenses, onDeleteExpense }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No expenses yet. Add your first expense above!
      </div>
    );
  }

  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Recent Expenses
      </h3>
      {sortedExpenses.map((expense) => (
        <div
          key={expense.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                {expense.description}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(expense.date).toLocaleDateString()} • {expense.category}
              </p>
            </div>
            <button
              onClick={() => onDeleteExpense(expense.id)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-4"
              aria-label="Delete expense"
            >
              🗑️
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Amount: </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatCurrency(expense.amount, expense.currency)}
              </span>
              {expense.currency !== 'NIS' && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  ({formatNIS(toNIS(expense.amount, expense.currency))})
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Paid by: </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {expense.paid_by}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Split:</p>
            <div className="flex gap-3 text-sm">
              {Object.entries(expense.splits).map(([member, amount]) => (
                <div key={member}>
                  <span className="text-gray-600 dark:text-gray-400">{member}: </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrency(amount, expense.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
