'use client';

import { useState } from 'react';
import { Settlement, Member, Currency } from '@/types';
import { MEMBERS, CURRENCIES } from '@/config';

interface SettlementFormProps {
  onAddSettlement: (settlement: Settlement) => void;
}

export default function SettlementForm({ onAddSettlement }: SettlementFormProps) {
  const [fromMember, setFromMember] = useState<Member>('Bloch');
  const [toMember, setToMember] = useState<Member>('Adji');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('NIS');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (fromMember === toMember) {
      alert('From and To members must be different');
      return;
    }

    const settlement: Settlement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      from_member: fromMember,
      to_member: toMember,
      amount: amountNum,
      currency,
      note: note || undefined,
    };

    onAddSettlement(settlement);
    
    setAmount('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Record Settlement
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From
          </label>
          <select
            value={fromMember}
            onChange={(e) => setFromMember(e.target.value as Member)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {MEMBERS.map((member) => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To
          </label>
          <select
            value={toMember}
            onChange={(e) => setToMember(e.target.value as Member)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {MEMBERS.map((member) => (
              <option key={member} value={member}>{member}</option>
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Cash payment"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        Record Settlement
      </button>
    </form>
  );
}
