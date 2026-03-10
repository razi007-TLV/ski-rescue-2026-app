'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Member } from '@/types';
import { MEMBERS } from '@/config';

export default function LandingPage() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedMember) {
      localStorage.setItem('currentUser', selectedMember);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">
              ⛷️ Ski Rescue 2026
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Expense Tracker & Split Calculator
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
              Who are you?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MEMBERS.map((member) => (
                <button
                  key={member}
                  onClick={() => setSelectedMember(member)}
                  className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    selectedMember === member
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  <div className="text-4xl mb-2">👤</div>
                  <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {member}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              📖 How to Use This App
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">1.</span>
                <p>
                  <strong>Add Expenses:</strong> Record any expense paid by you or other members. 
                  The app supports multiple currencies (EUR, USD, NIS) and automatically converts everything.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">2.</span>
                <p>
                  <strong>Split Costs:</strong> Choose to split equally among all members or select 
                  specific members and customize amounts as needed.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">3.</span>
                <p>
                  <strong>Track Balances:</strong> View the summary tab to see who owes what and 
                  get smart settlement suggestions that minimize the number of payments.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">4.</span>
                <p>
                  <strong>Record Settlements:</strong> When someone pays their debt, record it in 
                  the settlements tab to keep balances up to date.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedMember}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
              selectedMember
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedMember ? `Continue as ${selectedMember}` : 'Select Your Name to Continue'}
          </button>
        </div>

        <div className="text-center mt-6 text-gray-600 dark:text-gray-400 text-sm">
          <p>💡 Tip: Your data is saved locally in your browser</p>
        </div>
      </div>
    </div>
  );
}
