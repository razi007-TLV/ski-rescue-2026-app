'use client';

import { useState, useEffect } from 'react';
import { Expense, Member, Currency } from '@/types';
import { MEMBERS, CURRENCIES, CATEGORIES } from '@/config';

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
  defaultPaidBy: Member;
}

export default function ExpenseForm({ onAddExpense, defaultPaidBy }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [paidBy, setPaidBy] = useState<Member>(defaultPaidBy);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<Set<Member>>(new Set(MEMBERS));
  const [customSplits, setCustomSplits] = useState<Record<Member, string>>({
    Bloch: '',
    Adji: '',
    Razi: '',
  });

  useEffect(() => {
    setPaidBy(defaultPaidBy);
  }, [defaultPaidBy]);

  useEffect(() => {
    if (splitType === 'custom' && amount) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum) && selectedMembers.size > 0) {
        const splitAmount = (amountNum / selectedMembers.size).toFixed(2);
        const newSplits: Record<Member, string> = {
          Bloch: '',
          Adji: '',
          Razi: '',
        };
        selectedMembers.forEach(member => {
          newSplits[member] = splitAmount;
        });
        setCustomSplits(newSplits);
      }
    }
  }, [splitType, selectedMembers, amount]);

  const toggleMember = (member: Member) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(member)) {
      if (newSelected.size > 1) {
        newSelected.delete(member);
      }
    } else {
      newSelected.add(member);
    }
    setSelectedMembers(newSelected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (!description || isNaN(amountNum) || amountNum <= 0) {
      alert('Please fill in all fields correctly');
      return;
    }

    const finalCategory = category === 'Other' && customCategory ? customCategory : category;

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
      category: finalCategory,
    };

    onAddExpense(expense);
    
    setDescription('');
    setAmount('');
    setCustomCategory('');
    setCategory(CATEGORIES[0]);
    setSplitType('equal');
    setSelectedMembers(new Set(MEMBERS));
    setCustomSplits({ Bloch: '', Adji: '', Razi: '' });
    setPaidBy(defaultPaidBy);
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

        {category === 'Other' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Category
            </label>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter custom category"
            />
          </div>
        )}

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
            <option value="equal">Equal Split (All Members)</option>
            <option value="custom">Custom Split</option>
          </select>
        </div>
      </div>

      {splitType === 'custom' && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Members to Split Between
            </label>
            <div className="flex gap-3">
              {MEMBERS.map((member) => (
                <label
                  key={member}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${
                    selectedMembers.has(member)
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500'
                      : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member)}
                    onChange={() => toggleMember(member)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-800 dark:text-gray-200">{member}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Split Amounts (auto-calculated, you can adjust)
            </label>
            <div className="grid grid-cols-3 gap-4">
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
                    disabled={!selectedMembers.has(member)}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                      !selectedMembers.has(member) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>
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
