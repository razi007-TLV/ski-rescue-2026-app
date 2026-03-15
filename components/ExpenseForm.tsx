'use client';

import { useState, useEffect } from 'react';
import { Expense, Member, Currency } from '@/types';
import { MEMBERS, CURRENCIES, CATEGORIES, Category } from '@/config';
import { sanitizeExpenseInput } from '@/lib/security';

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
  defaultPaidBy: Member;
}

export default function ExpenseForm({ onAddExpense, defaultPaidBy }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [paidBy, setPaidBy] = useState<Member>(defaultPaidBy);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<Set<Member>>(new Set());
  const [customSplits, setCustomSplits] = useState<Record<Member, string>>({
    Bloch: '',
    Adji: '',
    Razi: '',
    Kalish: '',
  });

  useEffect(() => {
    setPaidBy(defaultPaidBy);
  }, [defaultPaidBy]);

  useEffect(() => {
    if (splitType === 'custom') {
      if (selectedMembers.size === 0) {
        setSelectedMembers(new Set(MEMBERS));
      }
      if (amount) {
        const amountNum = parseFloat(amount);
        if (!isNaN(amountNum) && selectedMembers.size > 0) {
          const splitAmount = (amountNum / selectedMembers.size).toFixed(2);
          const newSplits: Record<Member, string> = {
            Bloch: '',
            Adji: '',
            Razi: '',
            Kalish: '',
          };
          selectedMembers.forEach(member => {
            newSplits[member] = splitAmount;
          });
          setCustomSplits(newSplits);
        }
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

    if (splitType === 'custom' && selectedMembers.size < 1) {
      alert('Please select at least 1 member for custom split');
      return;
    }

    const finalCategory = category === 'Other' && customCategory ? customCategory : category;

    let splits: Record<Member, number>;
    
    if (splitType === 'equal') {
      const memberCount = MEMBERS.length;
      const splitAmount = amountNum / memberCount;
      splits = {} as Record<Member, number>;
      MEMBERS.forEach(m => { splits[m] = splitAmount; });
    } else {
      splits = {} as Record<Member, number>;
      MEMBERS.forEach(m => { splits[m] = parseFloat(customSplits[m]) || 0; });
      
      const total = Object.values(splits).reduce((sum, v) => sum + v, 0);
      if (Math.abs(total - amountNum) > 0.01) {
        alert(`Split amounts (${total.toFixed(2)}) must equal total amount (${amountNum.toFixed(2)})`);
        return;
      }
    }

    const result = sanitizeExpenseInput({
      description,
      amount,
      currency,
      paidBy: paidBy,
      splits,
      category: finalCategory,
    });

    if (!result.valid) {
      alert(result.error);
      return;
    }

    onAddExpense(result.expense);
    
    setDescription('');
    setAmount('');
    setCustomCategory('');
    setCategory(CATEGORIES[0]);
    setSplitType('equal');
    setSelectedMembers(new Set());
    setCustomSplits({ Bloch: '', Adji: '', Razi: '', Kalish: '' });
    setPaidBy(defaultPaidBy);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
        Add New Expense
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white touch-manipulation"
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
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white touch-manipulation"
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
            maxLength={50}
            className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white touch-manipulation"
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
            min="0.01"
            max="1000000"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white touch-manipulation"
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
            className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white touch-manipulation"
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
          <input
            type="text"
            value={paidBy}
            readOnly
            className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Split Type
          </label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
            className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white touch-manipulation"
          >
            <option value="equal">Equal Split (All Members)</option>
            <option value="custom">Custom Split</option>
          </select>
        </div>
      </div>

      {splitType === 'custom' && (
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Members to Split Between
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {MEMBERS.map((member) => {
                return (
                  <label
                    key={member}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md transition-colors touch-manipulation ${
                      selectedMembers.has(member)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 cursor-pointer'
                        : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member)}
                      onChange={() => toggleMember(member)}
                      className="w-5 h-5 sm:w-4 sm:h-4"
                    />
                    <span className="text-sm sm:text-base text-gray-800 dark:text-gray-200">
                      {member}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Select at least 1 member (minimum required)
            </p>
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
                    inputMode="decimal"
                    value={customSplits[member]}
                    onChange={(e) => setCustomSplits({ ...customSplits, [member]: e.target.value })}
                    disabled={!selectedMembers.has(member)}
                    className={`w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white touch-manipulation ${
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
        className="w-full bg-indigo-600 active:bg-indigo-700 text-white font-medium py-3 sm:py-2.5 px-4 rounded-md transition-colors text-base touch-manipulation"
      >
        Add Expense
      </button>
    </form>
  );
}
