'use client';

import { SimplifiedDebt, Member, Currency } from '@/types';
import { formatAmount } from '@/lib/utils';

interface SettlementSuggestionsProps {
  debts: SimplifiedDebt[];
  currentUser: Member;
  onRecordPayment?: (from: Member, to: Member, amount: number) => void;
  displayCurrency?: Currency;
}

const MEMBER_COLORS: Record<Member, string> = {
  Bloch: 'bg-blue-500',
  Adji: 'bg-purple-500',
  Razi: 'bg-emerald-500',
  Kalish: 'bg-amber-500',
};

function MemberAvatar({ member, size = 'md' }: { member: Member; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base';
  return (
    <div className={`${sizeClass} ${MEMBER_COLORS[member]} rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
      {member[0]}
    </div>
  );
}

function DebtCard({
  debt,
  currentUser,
  onRecordPayment,
  displayCurrency = 'NIS',
}: {
  debt: SimplifiedDebt;
  currentUser: Member;
  onRecordPayment?: (from: Member, to: Member, amount: number) => void;
  displayCurrency?: Currency;
}) {
  const involvesUser = debt.from === currentUser || debt.to === currentUser;
  const userOwes = debt.from === currentUser;
  const userIsOwed = debt.to === currentUser;

  let borderColor = 'border-gray-200 dark:border-gray-700';
  let bgColor = 'bg-white dark:bg-gray-800';
  let accentBg = '';

  if (userIsOwed) {
    borderColor = 'border-green-300 dark:border-green-700';
    bgColor = 'bg-green-50/50 dark:bg-green-900/10';
    accentBg = 'bg-green-100 dark:bg-green-900/20';
  } else if (userOwes) {
    borderColor = 'border-red-300 dark:border-red-700';
    bgColor = 'bg-red-50/50 dark:bg-red-900/10';
    accentBg = 'bg-red-100 dark:bg-red-900/20';
  }

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-3 sm:p-4 transition-all ${accentBg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <MemberAvatar member={debt.from} />
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">pays</span>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <MemberAvatar member={debt.to} />
          <div className="ml-1 sm:ml-2 min-w-0">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {involvesUser ? (
                userOwes ? (
                  <>You pay <span className="font-semibold text-gray-700 dark:text-gray-200">{debt.to}</span></>
                ) : (
                  <><span className="font-semibold text-gray-700 dark:text-gray-200">{debt.from}</span> pays you</>
                )
              ) : (
                <><span className="font-semibold text-gray-700 dark:text-gray-200">{debt.from}</span> pays <span className="font-semibold text-gray-700 dark:text-gray-200">{debt.to}</span></>
              )}
            </p>
            <p className={`text-base sm:text-lg font-bold ${
              userIsOwed ? 'text-green-600 dark:text-green-400' :
              userOwes ? 'text-red-600 dark:text-red-400' :
              'text-gray-700 dark:text-gray-300'
            }`}>
              {formatAmount(debt.amount, displayCurrency)}
            </p>
          </div>
        </div>

        {onRecordPayment && (
          <button
            onClick={() => onRecordPayment(debt.from, debt.to, debt.amount)}
            className="flex-shrink-0 text-xs sm:text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors touch-manipulation"
            title="Record this payment"
          >
            Settle
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettlementSuggestions({ debts, currentUser, onRecordPayment, displayCurrency = 'NIS' }: SettlementSuggestionsProps) {
  if (debts.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl p-6 sm:p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-green-700 dark:text-green-300 font-semibold text-lg">
          All settled up!
        </p>
        <p className="text-green-600/70 dark:text-green-400/70 text-sm mt-1">
          No outstanding debts between group members.
        </p>
      </div>
    );
  }

  const userDebts = debts.filter(d => d.from === currentUser || d.to === currentUser);
  const otherDebts = debts.filter(d => d.from !== currentUser && d.to !== currentUser);

  const totalOwedToUser = debts
    .filter(d => d.to === currentUser)
    .reduce((sum, d) => sum + d.amount, 0);

  const totalUserOwes = debts
    .filter(d => d.from === currentUser)
    .reduce((sum, d) => sum + d.amount, 0);

  const userNet = totalOwedToUser - totalUserOwes;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero: personal summary */}
      <div className={`rounded-xl p-4 sm:p-6 text-center border ${
        userNet > 0
          ? 'bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800'
          : userNet < 0
          ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          {userNet > 0 ? 'You are owed' : userNet < 0 ? 'You owe' : 'Your balance'}
        </p>
        <p className={`text-3xl sm:text-4xl font-extrabold ${
          userNet > 0
            ? 'text-green-600 dark:text-green-400'
            : userNet < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {formatAmount(Math.abs(userNet), displayCurrency)}
        </p>
        {userNet !== 0 && (
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
            {userNet > 0
              ? `from ${userDebts.filter(d => d.to === currentUser).length} member${userDebts.filter(d => d.to === currentUser).length !== 1 ? 's' : ''}`
              : `to ${userDebts.filter(d => d.from === currentUser).length} member${userDebts.filter(d => d.from === currentUser).length !== 1 ? 's' : ''}`
            }
          </p>
        )}
      </div>

      {/* User's debts */}
      {userDebts.length > 0 && (
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            Your settlements
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {userDebts.map((debt, i) => (
              <DebtCard key={i} debt={debt} currentUser={currentUser} onRecordPayment={onRecordPayment} displayCurrency={displayCurrency} />
            ))}
          </div>
        </div>
      )}

      {/* Debts between others */}
      {otherDebts.length > 0 && (
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
            Between others
          </h3>
          <div className="space-y-2 sm:space-y-3 opacity-75">
            {otherDebts.map((debt, i) => (
              <DebtCard key={i} debt={debt} currentUser={currentUser} onRecordPayment={onRecordPayment} displayCurrency={displayCurrency} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
