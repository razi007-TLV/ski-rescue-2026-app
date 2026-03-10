'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Expense, Settlement, Balance, SimplifiedDebt, Member } from '@/types';
import { calculateBalances, simplifyDebts, formatNIS } from '@/lib/utils';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BalancesSummary from '@/components/BalancesSummary';
import SettlementSuggestions from '@/components/SettlementSuggestions';
import SettlementForm from '@/components/SettlementForm';
import SettlementList from '@/components/SettlementList';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements' | 'summary'>('expenses');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.push('/landing');
      return;
    }
    setCurrentUser(user as Member);
    
    const storedExpenses = localStorage.getItem('expenses');
    const storedSettlements = localStorage.getItem('settlements');
    
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }
    if (storedSettlements) {
      setSettlements(JSON.parse(storedSettlements));
    }
    
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    const newBalances = calculateBalances(expenses, settlements);
    setBalances(newBalances);
    setDebts(simplifyDebts(newBalances));
  }, [expenses, settlements]);

  useEffect(() => {
    localStorage.setItem('settlements', JSON.stringify(settlements));
  }, [settlements]);

  const addExpense = (expense: Expense) => {
    setExpenses([...expenses, expense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const addSettlement = (settlement: Settlement) => {
    setSettlements([...settlements, settlement]);
  };

  const deleteSettlement = (id: string) => {
    setSettlements(settlements.filter(s => s.id !== id));
  };

  const handleChangeUser = () => {
    localStorage.removeItem('currentUser');
    router.push('/landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-2xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 dark:text-indigo-300 mb-2">
            ⛷️ Ski Rescue 2026
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Expense Tracker & Split Calculator
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Logged in as:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentUser}</span>
            <button
              onClick={handleChangeUser}
              className="ml-2 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 underline"
            >
              Change
            </button>
          </div>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'settlements'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Settlements
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Summary
            </button>
          </div>

          {activeTab === 'expenses' && (
            <div>
              <ExpenseForm onAddExpense={addExpense} defaultPaidBy={currentUser!} />
              <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} />
            </div>
          )}

          {activeTab === 'settlements' && (
            <div>
              <SettlementForm onAddSettlement={addSettlement} />
              <SettlementList settlements={settlements} onDeleteSettlement={deleteSettlement} />
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <BalancesSummary balances={balances} />
              <SettlementSuggestions debts={debts} />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Quick Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {expenses.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNIS(balances.reduce((sum, b) => sum + b.paid, 0))}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Settlements Made</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {settlements.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
