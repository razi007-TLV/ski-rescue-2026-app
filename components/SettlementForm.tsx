'use client';

import { useState, useEffect } from 'react';
import { Settlement, Member, Currency } from '@/types';
import { MEMBERS, CURRENCIES } from '@/config';
import { sanitizeSettlementInput } from '@/lib/security';

interface SettlementFormProps {
  onAddSettlement: (settlement: Settlement) => void;
  defaults?: { from: Member; to: Member; amount: number } | null;
  onClearDefaults?: () => void;
}

export default function SettlementForm({ onAddSettlement, defaults, onClearDefaults }: SettlementFormProps) {
  const [fromMember, setFromMember] = useState<Member>('Bloch');
  const [toMember, setToMember] = useState<Member>('Adji');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('NIS');
  const [note, setNote] = useState('');
  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);

  useEffect(() => {
    if (defaults && !hasAppliedDefaults) {
      setFromMember(defaults.from);
      setToMember(defaults.to);
      setAmount(defaults.amount.toFixed(2));
      setCurrency('NIS');
      setHasAppliedDefaults(true);
    }
    if (!defaults) {
      setHasAppliedDefaults(false);
    }
  }, [defaults, hasAppliedDefaults]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = sanitizeSettlementInput({
      fromMember,
      toMember,
      amount,
      currency,
      note,
    });

    if (!result.valid) {
      alert(result.error);
      return;
    }

    onAddSettlement(result.settlement);
    
    setAmount('');
    setNote('');
    if (onClearDefaults) onClearDefaults();
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
            min="0.01"
            max="1000000"
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
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Cash payment"
          />
        </div>
      </div>

      {fromMember === toMember && (
        <p className="text-sm text-red-500 dark:text-red-400">From and To members must be different.</p>
      )}

      <button
        type="submit"
        disabled={fromMember === toMember}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        Record Settlement
      </button>
    </form>
  );
}
