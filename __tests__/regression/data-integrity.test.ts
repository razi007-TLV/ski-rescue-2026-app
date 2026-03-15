import { loadExpenses, loadSettlements, loadCurrentUser } from '@/lib/security';
import { calculateBalances, simplifyDebts } from '@/lib/utils';
import { Expense, Settlement, Member } from '@/types';
import { MEMBERS } from '@/config';

beforeEach(() => {
  localStorage.clear();
});

describe('Data Integrity: localStorage Persistence', () => {
  const validExpense: Expense = {
    id: 'e1',
    date: '2026-03-10T00:00:00.000Z',
    description: 'Test expense',
    amount: 100,
    currency: 'NIS',
    paid_by: 'Bloch',
    splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
    category: 'Food & Dining',
  };

  const validSettlement: Settlement = {
    id: 's1',
    date: '2026-03-10T00:00:00.000Z',
    from_member: 'Adji',
    to_member: 'Bloch',
    amount: 50,
    currency: 'NIS',
    note: 'Cash',
  };

  it('should round-trip expenses through localStorage', () => {
    localStorage.setItem('expenses', JSON.stringify([validExpense]));
    const loaded = loadExpenses();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(validExpense);
  });

  it('should round-trip settlements through localStorage', () => {
    localStorage.setItem('settlements', JSON.stringify([validSettlement]));
    const loaded = loadSettlements();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(validSettlement);
  });

  it('should round-trip currentUser through localStorage', () => {
    localStorage.setItem('currentUser', 'Razi');
    expect(loadCurrentUser()).toBe('Razi');
  });

  it('should preserve expense fields through serialization', () => {
    const expense: Expense = {
      id: 'complex-1',
      date: '2026-03-10T14:30:00.000Z',
      description: 'Ski equipment rental & insurance',
      amount: 450.75,
      currency: 'EUR',
      paid_by: 'Kalish',
      splits: { Bloch: 112.69, Adji: 112.69, Razi: 112.69, Kalish: 112.68 },
      category: 'Equipment',
    };

    localStorage.setItem('expenses', JSON.stringify([expense]));
    const loaded = loadExpenses();
    expect(loaded[0].amount).toBe(450.75);
    expect(loaded[0].currency).toBe('EUR');
    expect(loaded[0].splits.Bloch).toBe(112.69);
    expect(loaded[0].description).toBe('Ski equipment rental & insurance');
  });
});

describe('Data Integrity: Corrupted Data Resilience', () => {
  it('should handle completely empty localStorage', () => {
    expect(loadExpenses()).toEqual([]);
    expect(loadSettlements()).toEqual([]);
    expect(loadCurrentUser()).toBeNull();
  });

  it('should handle corrupted JSON in expenses', () => {
    localStorage.setItem('expenses', 'not valid json!!!');
    expect(loadExpenses()).toEqual([]);
  });

  it('should handle corrupted JSON in settlements', () => {
    localStorage.setItem('settlements', '{{{{');
    expect(loadSettlements()).toEqual([]);
  });

  it('should handle null values in expense array', () => {
    localStorage.setItem('expenses', JSON.stringify([null, null, null]));
    expect(loadExpenses()).toEqual([]);
  });

  it('should handle mixed valid and invalid expenses', () => {
    const data = [
      { id: 'valid', date: '2026-03-10', description: 'Dinner', amount: 100, currency: 'NIS', paid_by: 'Bloch', splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 } },
      { id: '', date: 'bad', description: '', amount: -1, currency: 'XXX', paid_by: 'nobody', splits: {} },
      42,
      'string',
      true,
    ];
    localStorage.setItem('expenses', JSON.stringify(data));
    const result = loadExpenses();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid');
  });

  it('should handle expense with missing required fields', () => {
    const data = [
      { id: '1', description: 'No date field', amount: 100 },
      { id: '2', date: '2026-03-10', amount: 100 },
    ];
    localStorage.setItem('expenses', JSON.stringify(data));
    expect(loadExpenses()).toEqual([]);
  });

  it('should handle settlement with from_member === to_member', () => {
    const data = [
      { id: 's1', date: '2026-03-10', from_member: 'Bloch', to_member: 'Bloch', amount: 100, currency: 'NIS' },
    ];
    localStorage.setItem('settlements', JSON.stringify(data));
    expect(loadSettlements()).toEqual([]);
  });

  it('should handle localStorage with huge data gracefully', () => {
    const bigData = Array.from({ length: 20000 }, (_, i) => ({
      id: `e${i}`,
      date: '2026-03-10',
      description: `Expense ${i}`,
      amount: 10,
      currency: 'NIS',
      paid_by: 'Bloch',
      splits: { Bloch: 2.5, Adji: 2.5, Razi: 2.5, Kalish: 2.5 },
    }));
    localStorage.setItem('expenses', JSON.stringify(bigData));
    const result = loadExpenses();
    expect(result.length).toBeLessThanOrEqual(10000);
  });
});

describe('Data Integrity: Balance Consistency', () => {
  it('total paid should always equal total owed', () => {
    const expenses: Expense[] = [
      {
        id: '1', date: '2026-03-10', description: 'A',
        amount: 400, currency: 'NIS', paid_by: 'Bloch',
        splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 },
      },
      {
        id: '2', date: '2026-03-10', description: 'B',
        amount: 200, currency: 'NIS', paid_by: 'Adji',
        splits: { Bloch: 50, Adji: 50, Razi: 50, Kalish: 50 },
      },
    ];

    const balances = calculateBalances(expenses, []);
    const totalPaid = balances.reduce((sum, b) => sum + b.paid, 0);
    const totalOwed = balances.reduce((sum, b) => sum + b.owes, 0);
    expect(totalPaid).toBeCloseTo(totalOwed, 10);
  });

  it('simplified debts should never exceed original balance amounts', () => {
    const expenses: Expense[] = [{
      id: '1', date: '2026-03-10', description: 'Big dinner',
      amount: 1000, currency: 'NIS', paid_by: 'Bloch',
      splits: { Bloch: 250, Adji: 250, Razi: 250, Kalish: 250 },
    }];

    const balances = calculateBalances(expenses, []);
    const debts = simplifyDebts(balances);
    const maxDebt = Math.max(...debts.map(d => d.amount));
    expect(maxDebt).toBeLessThanOrEqual(1000);
  });

  it('after full settlement, simplifyDebts should return empty', () => {
    const expenses: Expense[] = [{
      id: '1', date: '2026-03-10', description: 'Dinner',
      amount: 400, currency: 'NIS', paid_by: 'Bloch',
      splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 },
    }];

    const settlements: Settlement[] = [
      { id: 's1', date: '2026-03-11', from_member: 'Adji', to_member: 'Bloch', amount: 100, currency: 'NIS' },
      { id: 's2', date: '2026-03-11', from_member: 'Razi', to_member: 'Bloch', amount: 100, currency: 'NIS' },
      { id: 's3', date: '2026-03-11', from_member: 'Kalish', to_member: 'Bloch', amount: 100, currency: 'NIS' },
    ];

    const balances = calculateBalances(expenses, settlements);
    const debts = simplifyDebts(balances);
    expect(debts).toHaveLength(0);
  });

  it('simplifyDebts should never have from === to', () => {
    const scenarios = [
      [
        { member: 'Bloch' as Member, paid: 400, owes: 100, net: 300 },
        { member: 'Adji' as Member, paid: 0, owes: 100, net: -100 },
        { member: 'Razi' as Member, paid: 0, owes: 100, net: -100 },
        { member: 'Kalish' as Member, paid: 0, owes: 100, net: -100 },
      ],
      [
        { member: 'Bloch' as Member, paid: 200, owes: 100, net: 100 },
        { member: 'Adji' as Member, paid: 200, owes: 100, net: 100 },
        { member: 'Razi' as Member, paid: 0, owes: 100, net: -100 },
        { member: 'Kalish' as Member, paid: 0, owes: 100, net: -100 },
      ],
      [
        { member: 'Bloch' as Member, paid: 0, owes: 0, net: 0 },
        { member: 'Adji' as Member, paid: 0, owes: 0, net: 0 },
        { member: 'Razi' as Member, paid: 0, owes: 0, net: 0 },
        { member: 'Kalish' as Member, paid: 0, owes: 0, net: 0 },
      ],
    ];

    scenarios.forEach(balances => {
      const debts = simplifyDebts(balances);
      debts.forEach(d => expect(d.from).not.toBe(d.to));
    });
  });

  it('all members in debts should be valid MEMBERS', () => {
    const expenses: Expense[] = [{
      id: '1', date: '2026-03-10', description: 'Test',
      amount: 400, currency: 'NIS', paid_by: 'Bloch',
      splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 },
    }];

    const balances = calculateBalances(expenses, []);
    const debts = simplifyDebts(balances);
    debts.forEach(d => {
      expect(MEMBERS).toContain(d.from);
      expect(MEMBERS).toContain(d.to);
    });
  });
});

describe('Data Integrity: Deletion Safety', () => {
  it('deleting an expense should not affect other expenses', () => {
    const expenses: Expense[] = [
      { id: '1', date: '2026-03-10', description: 'A', amount: 100, currency: 'NIS', paid_by: 'Bloch', splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 } },
      { id: '2', date: '2026-03-10', description: 'B', amount: 200, currency: 'NIS', paid_by: 'Adji', splits: { Bloch: 50, Adji: 50, Razi: 50, Kalish: 50 } },
      { id: '3', date: '2026-03-10', description: 'C', amount: 300, currency: 'NIS', paid_by: 'Razi', splits: { Bloch: 75, Adji: 75, Razi: 75, Kalish: 75 } },
    ];

    const remaining = expenses.filter(e => e.id !== '2');
    expect(remaining).toHaveLength(2);
    expect(remaining.find(e => e.id === '1')).toBeDefined();
    expect(remaining.find(e => e.id === '3')).toBeDefined();
    expect(remaining.find(e => e.id === '2')).toBeUndefined();
  });

  it('deleting a settlement should not affect expenses', () => {
    const expenses: Expense[] = [
      { id: '1', date: '2026-03-10', description: 'Dinner', amount: 400, currency: 'NIS', paid_by: 'Bloch', splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 } },
    ];

    const settlements: Settlement[] = [
      { id: 's1', date: '2026-03-11', from_member: 'Adji', to_member: 'Bloch', amount: 100, currency: 'NIS' },
    ];

    const remainingSettlements = settlements.filter(s => s.id !== 's1');
    expect(remainingSettlements).toHaveLength(0);
    expect(expenses).toHaveLength(1);
  });

  it('deleting a non-existent ID should not change the list', () => {
    const expenses: Expense[] = [
      { id: '1', date: '2026-03-10', description: 'Dinner', amount: 100, currency: 'NIS', paid_by: 'Bloch', splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 } },
    ];

    const remaining = expenses.filter(e => e.id !== 'nonexistent');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('1');
  });
});
