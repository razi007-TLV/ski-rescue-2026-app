import { Expense, Settlement, Member, Balance, SimplifiedDebt } from '@/types';
import { MEMBERS, EXCHANGE_RATES } from '@/config';

export function toNIS(amount: number, currency: string): number {
  return amount * (EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1);
}

export function formatCurrency(amount: number, currency: string): string {
  const formatted = amount.toFixed(2);
  const symbol = currency === 'NIS' ? '₪' : currency === 'USD' ? '$' : '€';
  return `${symbol}${formatted}`;
}

export function formatNIS(amount: number): string {
  return `₪${amount.toFixed(2)}`;
}

export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[]
): Balance[] {
  const balances: Record<Member, { paid: number; owes: number }> = {
    Bloch: { paid: 0, owes: 0 },
    Adji: { paid: 0, owes: 0 },
    Razi: { paid: 0, owes: 0 },
  };

  expenses.forEach((expense) => {
    const amountInNIS = toNIS(expense.amount, expense.currency);
    balances[expense.paid_by].paid += amountInNIS;

    Object.entries(expense.splits).forEach(([member, splitAmount]) => {
      const splitInNIS = toNIS(Number(splitAmount), expense.currency);
      balances[member as Member].owes += splitInNIS;
    });
  });

  settlements.forEach((settlement) => {
    const amountInNIS = toNIS(settlement.amount, settlement.currency);
    balances[settlement.from_member].paid += amountInNIS;
    balances[settlement.to_member].owes += amountInNIS;
  });

  return MEMBERS.map((member) => ({
    member,
    paid: balances[member].paid,
    owes: balances[member].owes,
    net: balances[member].paid - balances[member].owes,
  }));
}

export function simplifyDebts(balances: Balance[]): SimplifiedDebt[] {
  const netBalances = new Map<Member, number>();
  balances.forEach((b) => netBalances.set(b.member, b.net));

  const debts: SimplifiedDebt[] = [];
  const creditors = balances.filter((b) => b.net > 0.01).sort((a, b) => b.net - a.net);
  const debtors = balances.filter((b) => b.net < -0.01).sort((a, b) => a.net - b.net);

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const creditorBalance = netBalances.get(creditor.member)!;
    const debtorBalance = netBalances.get(debtor.member)!;

    const amount = Math.min(creditorBalance, -debtorBalance);

    if (amount > 0.01) {
      debts.push({
        from: debtor.member,
        to: creditor.member,
        amount,
      });

      netBalances.set(creditor.member, creditorBalance - amount);
      netBalances.set(debtor.member, debtorBalance + amount);
    }

    if (netBalances.get(creditor.member)! < 0.01) i++;
    if (netBalances.get(debtor.member)! > -0.01) j++;
  }

  return debts;
}
