'use client';

import { useState } from 'react';
import { Expense, Member, Currency } from '@/types';
import { MEMBERS, CURRENCIES, CATEGORIES } from '@/config';

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
}

export default function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('NIS');
  const [paidBy, setPaidBy] = useState<Member>('Bloch');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<Member, string>>({
    Bloch: '',
    Adji: '',
    Razi: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (!description || isNaN(amountNum) || amountNum <= 0) {
      alert('Please fill in all fields correctly');
      return;
    }

    let splits: Record<Member, number>;
    
    if (splitType === 'equal') {
      const splitAmount = amountNum / 3;
      splits = {
        Bloch: splitAmount,
        Adji: splitAmount,
        Razi: splitAmount,
      };
    } else {
      splits = {
        Bloch: parseFloat(customSplits.Bloch) || 0,
        Adji: parseFloat(customSplits.Adji) || 0,
        Razi: parseFloat(customSplits.Razi) || 0,
      };
      
      const total = splits.Bloch + splits.Adji + splits.Razi;
      if (Math.abs(total - amountNum) > 0.01) {
        alert(`Split amounts (${total.toFixed(2)}) must equal total amount (${amountNum.toFixed(2)})`);
        return;
      }
    }

    const expense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description,
      amount: amountNum,
      currency,
      paid_by: paidBy,
      splits,
      category,
    };

    onAddExpense(expense);
    
    setDescription('');
    setAmount('');
    setCustomSplits({ Bloch: '', Adji: '', Razi: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Add New Expense
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Ski lift tickets"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Paid By
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value as Member)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {MEMBERS.map((member) => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Split Type
          </label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="equal">Equal Split</option>
            <option value="custom">Custom Split</option>
          </select>
        </div>
      </div>

      {splitType === 'custom' && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          {MEMBERS.map((member) => (
            <div key={member}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {member}
              </label>
              <input
                type="number"
                step="0.01"
                value={customSplits[member]}
                onChange={(e) => setCustomSplits({ ...customSplits, [member]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        Add Expense
      </button>
    </form>
  );
}
