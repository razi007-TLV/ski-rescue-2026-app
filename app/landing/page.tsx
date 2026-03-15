'use client';

import { useRouter } from 'next/navigation';
import { Member } from '@/types';
import { MEMBERS } from '@/config';
import { logActivity } from '@/lib/logger';

export default function LandingPage() {
  const router = useRouter();

  const handleMemberSelect = (member: Member) => {
    logActivity(member, 'login');
    localStorage.setItem('currentUser', member);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEzOSwgMTkyLCAyMzcsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
      
      <div className="hidden sm:block absolute top-10 left-10 text-8xl opacity-10 dark:opacity-5">⛷️</div>
      <div className="hidden sm:block absolute bottom-20 right-20 text-9xl opacity-10 dark:opacity-5">🏔️</div>
      <div className="hidden sm:block absolute top-1/3 right-1/4 text-7xl opacity-10 dark:opacity-5">❄️</div>
      
      <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-5xl w-full">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-6 sm:p-8 md:p-12 text-center relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMyIgY3k9IjMiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-20"></div>
              <div className="relative">
                <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 animate-bounce">⛷️</div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                  Ski Rescue 2026
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100">
                  Split expenses. Track balances. Settle up.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 border border-sky-200 dark:border-slate-600">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">💡</span>
                  How It Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💰</div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">Add Expenses</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Log expenses in any currency. Split equally or customize.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📊</div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">See Balances</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Real-time tracking shows who owes what instantly.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">✅</div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">Settle Up</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Record payments and keep everyone square.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 text-center">
                  Click Your Name to Start
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  {MEMBERS.map((member) => (
                    <button
                      key={member}
                      onClick={() => handleMemberSelect(member)}
                      className="group relative p-8 sm:p-10 rounded-xl sm:rounded-2xl border-2 transition-all transform hover:scale-105 hover:-translate-y-2 active:scale-95 border-gray-200 dark:border-slate-600 bg-gradient-to-br from-white to-sky-50 dark:from-slate-700/50 dark:to-slate-600/50 hover:border-blue-500 dark:hover:border-blue-400 shadow-lg hover:shadow-2xl touch-manipulation"
                    >
                      <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 transition-transform group-hover:scale-110 group-hover:rotate-12 group-active:scale-110 group-active:rotate-12">
                        🎿
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {member}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                        Click to enter →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8 space-y-2">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm flex items-center justify-center gap-2">
              <span>🔒</span>
              All data saved locally in your browser
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              Multi-currency support • Smart debt simplification • Offline ready
            </p>
            <a
              href="/admin"
              className="inline-block mt-2 text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
