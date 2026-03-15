'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Expense, Settlement, Balance, SimplifiedDebt, Member, Currency } from '@/types';
import { calculateBalances, simplifyDebts, formatNIS, formatAmount } from '@/lib/utils';
import { CURRENCIES, EXCHANGE_RATES } from '@/config';
import {
  loadCurrentUser,
  loadExpenses as loadLocalExpenses,
  loadSettlements as loadLocalSettlements,
} from '@/lib/security';
import {
  fetchExpenses,
  fetchSettlements,
  insertExpense,
  removeExpense,
  insertSettlement,
  removeSettlement,
  logActivity,
} from '@/lib/supabase';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BalancesSummary from '@/components/BalancesSummary';
import SettlementSuggestions from '@/components/SettlementSuggestions';
import SettlementForm from '@/components/SettlementForm';
import SettlementList from '@/components/SettlementList';
import CelebrationModal from '@/components/CelebrationModal';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements' | 'summary'>('expenses');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settlementDefaults, setSettlementDefaults] = useState<{
    from: Member; to: Member; amount: number;
  } | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('NIS');
  const [showCelebration, setShowCelebration] = useState(false);
  const [migrationData, setMigrationData] = useState<{
    expenses: Expense[];
    settlements: Settlement[];
  } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const loadData = useCallback(async () => {
    const [expensesData, settlementsData] = await Promise.all([
      fetchExpenses(),
      fetchSettlements(),
    ]);
    setExpenses(expensesData);
    setSettlements(settlementsData);
  }, []);

  useEffect(() => {
    const user = loadCurrentUser();
    if (!user) {
      router.push('/landing');
      return;
    }
    setCurrentUser(user);
    logActivity(user, 'page_load');
    loadData().then(() => {
      const localExpenses = loadLocalExpenses();
      const localSettlements = loadLocalSettlements();
      if (localExpenses.length > 0 || localSettlements.length > 0) {
        setMigrationData({ expenses: localExpenses, settlements: localSettlements });
      }
    }).finally(() => setIsLoading(false));
  }, [router, loadData]);

  useEffect(() => {
    const newBalances = calculateBalances(expenses, settlements);
    setBalances(newBalances);
    setDebts(simplifyDebts(newBalances));
  }, [expenses, settlements]);

  const addExpense = async (expense: Expense) => {
    setIsSaving(true);
    const saved = await insertExpense(expense);
    if (saved) {
      setExpenses((prev) => [saved, ...prev]);
      setShowCelebration(true);
      logActivity(currentUser!, 'add_expense', {
        id: saved.id, date: saved.date, description: saved.description,
        amount: saved.amount, currency: saved.currency, paid_by: saved.paid_by,
        splits: saved.splits, category: saved.category ?? null,
      });
    } else {
      alert('Failed to save expense. Please try again.');
    }
    setIsSaving(false);
  };

  const deleteExpense = async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    const success = await removeExpense(id);
    if (success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      logActivity(currentUser!, 'delete_expense', {
        id, date: expense?.date, description: expense?.description,
        amount: expense?.amount, currency: expense?.currency,
        paid_by: expense?.paid_by, splits: expense?.splits,
        category: expense?.category ?? null,
      });
    } else {
      alert('Failed to delete expense. Please try again.');
    }
  };

  const addSettlement = async (settlement: Settlement) => {
    setIsSaving(true);
    const saved = await insertSettlement(settlement);
    if (saved) {
      setSettlements((prev) => [saved, ...prev]);
      setShowCelebration(true);
      logActivity(currentUser!, 'add_settlement', {
        id: saved.id, date: saved.date, from: saved.from_member, to: saved.to_member,
        amount: saved.amount, currency: saved.currency, note: saved.note ?? null,
      });
    } else {
      alert('Failed to save settlement. Please try again.');
    }
    setIsSaving(false);
  };

  const deleteSettlement = async (id: string) => {
    const settlement = settlements.find((s) => s.id === id);
    const success = await removeSettlement(id);
    if (success) {
      setSettlements((prev) => prev.filter((s) => s.id !== id));
      logActivity(currentUser!, 'delete_settlement', {
        id, date: settlement?.date, from: settlement?.from_member, to: settlement?.to_member,
        amount: settlement?.amount, currency: settlement?.currency, note: settlement?.note ?? null,
      });
    } else {
      alert('Failed to delete settlement. Please try again.');
    }
  };

  const handleMigrate = async () => {
    if (!migrationData) return;
    setIsMigrating(true);

    let migratedExpenses = 0;
    let failedExpenses = 0;
    let migratedSettlements = 0;
    let failedSettlements = 0;

    for (const expense of migrationData.expenses) {
      const fixedExpense = { ...expense };
      if (!isValidUUID(fixedExpense.id)) {
        fixedExpense.id = crypto.randomUUID();
      }
      const saved = await insertExpense(fixedExpense);
      if (saved) migratedExpenses++;
      else failedExpenses++;
    }

    for (const settlement of migrationData.settlements) {
      const fixedSettlement = { ...settlement };
      if (!isValidUUID(fixedSettlement.id)) {
        fixedSettlement.id = crypto.randomUUID();
      }
      const saved = await insertSettlement(fixedSettlement);
      if (saved) migratedSettlements++;
      else failedSettlements++;
    }

    const totalFailed = failedExpenses + failedSettlements;
    if (totalFailed === 0) {
      localStorage.removeItem('expenses');
      localStorage.removeItem('settlements');
      setMigrationData(null);
    }

    setIsMigrating(false);
    await loadData();

    logActivity(currentUser!, 'migration', {
      migratedExpenses, failedExpenses, migratedSettlements, failedSettlements,
    });

    if (totalFailed > 0) {
      alert(
        `Partial migration: Uploaded ${migratedExpenses} expenses and ${migratedSettlements} settlements.\n` +
        `Failed: ${failedExpenses} expenses and ${failedSettlements} settlements.\n` +
        `Local data was kept — you can retry.`
      );
    } else {
      alert(`Migration complete! Uploaded ${migratedExpenses} expenses and ${migratedSettlements} settlements.`);
    }
  };

  const handleDismissMigration = () => {
    localStorage.removeItem('expenses');
    localStorage.removeItem('settlements');
    setMigrationData(null);
  };

  const handleRecordPayment = (from: Member, to: Member, amount: number) => {
    logActivity(currentUser!, 'quick_settle', { from, to, amount });
    setSettlementDefaults({ from, to, amount });
    setActiveTab('settlements');
  };

  const handleChangeUser = () => {
    logActivity(currentUser!, 'logout');
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
        <header className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-900 dark:text-indigo-300 mb-1 sm:mb-2">
            ⛷️ Ski Rescue 2026
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Expense Tracker & Split Calculator
          </p>
          <div className="mt-2 sm:mt-3 md:mt-4 flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
            <span className="text-gray-600 dark:text-gray-400">Logged in as:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentUser}</span>
            <button
              onClick={handleChangeUser}
              className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 underline touch-manipulation"
            >
              Change
            </button>
            <button
              onClick={() => { loadData(); logActivity(currentUser!, 'refresh'); }}
              className="ml-1 sm:ml-2 text-xs sm:text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline touch-manipulation"
            >
              Refresh
            </button>
          </div>
        </header>

        {isSaving && (
          <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
            Saving...
          </div>
        )}

        {migrationData && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
            <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2 text-base sm:text-lg">
              Found local data on this device
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
              {migrationData.expenses.length} expense{migrationData.expenses.length !== 1 ? 's' : ''}
              {' and '}
              {migrationData.settlements.length} settlement{migrationData.settlements.length !== 1 ? 's' : ''}
              {' saved locally. Upload them to the shared database so everyone can see them?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm touch-manipulation"
              >
                {isMigrating ? 'Uploading...' : 'Upload to shared database'}
              </button>
              <button
                onClick={handleDismissMigration}
                disabled={isMigrating}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-md transition-colors text-sm touch-manipulation"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('expenses'); logActivity(currentUser!, 'tab_switch', { tab: 'expenses' }); }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation ${
                activeTab === 'expenses'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 active:text-gray-700 dark:text-gray-400 dark:active:text-gray-200'
              }`}
            >
              💰 Expenses
            </button>
            <button
              onClick={() => { setActiveTab('settlements'); logActivity(currentUser!, 'tab_switch', { tab: 'settlements' }); }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation ${
                activeTab === 'settlements'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 active:text-gray-700 dark:text-gray-400 dark:active:text-gray-200'
              }`}
            >
              💳 Settlements
            </button>
            <button
              onClick={() => { setActiveTab('summary'); logActivity(currentUser!, 'tab_switch', { tab: 'summary' }); }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation ${
                activeTab === 'summary'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 active:text-gray-700 dark:text-gray-400 dark:active:text-gray-200'
              }`}
            >
              📊 Summary
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
              <SettlementForm
                onAddSettlement={(s) => { addSettlement(s); setSettlementDefaults(null); }}
                defaults={settlementDefaults}
                onClearDefaults={() => setSettlementDefaults(null)}
              />
              <SettlementList settlements={settlements} onDeleteSettlement={deleteSettlement} />
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <div className="flex flex-col items-end mb-4 gap-1">
                <div className="flex items-center">
                  <label className="text-sm text-gray-500 dark:text-gray-400 mr-2">Display in:</label>
                  <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    {CURRENCIES.map((curr) => (
                      <button
                        key={curr}
                        onClick={() => { setDisplayCurrency(curr); logActivity(currentUser!, 'currency_switch', { currency: curr }); }}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation ${
                          displayCurrency === curr
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {curr === 'NIS' ? '₪ NIS' : curr === 'USD' ? '$ USD' : '€ EUR'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  1 USD = ₪{EXCHANGE_RATES.USD.toFixed(2)}  ·  1 EUR = ₪{EXCHANGE_RATES.EUR.toFixed(2)}
                </p>
              </div>
              <SettlementSuggestions
                debts={debts}
                currentUser={currentUser!}
                onRecordPayment={handleRecordPayment}
                displayCurrency={displayCurrency}
              />
              <BalancesSummary balances={balances} displayCurrency={displayCurrency} />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-200">
            Quick Stats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {expenses.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatAmount(balances.reduce((sum, b) => sum + b.paid, 0), displayCurrency)}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Settlements Made</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {settlements.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showCelebration && (
        <CelebrationModal onClose={() => setShowCelebration(false)} />
      )}
    </div>
  );
}
