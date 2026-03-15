import { calculateBalances, simplifyDebts, toNIS, formatCurrency, formatNIS } from '@/lib/utils';
import { Expense, Settlement, Member, Balance } from '@/types';
import { EXCHANGE_RATES } from '@/config';

describe('Regression: Balance Calculations', () => {
  describe('Single expense, equal split', () => {
    it('should correctly split ₪400 among 4 members', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Dinner',
        amount: 400, currency: 'NIS', paid_by: 'Bloch',
        splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 },
      }];

      const balances = calculateBalances(expenses, []);
      const bloch = balances.find(b => b.member === 'Bloch')!;
      expect(bloch.paid).toBe(400);
      expect(bloch.owes).toBe(100);
      expect(bloch.net).toBe(300);

      const adji = balances.find(b => b.member === 'Adji')!;
      expect(adji.paid).toBe(0);
      expect(adji.owes).toBe(100);
      expect(adji.net).toBe(-100);
    });

    it('net balances should sum to zero', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Lift tickets',
        amount: 1200, currency: 'NIS', paid_by: 'Razi',
        splits: { Bloch: 300, Adji: 300, Razi: 300, Kalish: 300 },
      }];

      const balances = calculateBalances(expenses, []);
      const totalNet = balances.reduce((sum, b) => sum + b.net, 0);
      expect(totalNet).toBeCloseTo(0, 10);
    });
  });

  describe('Multiple expenses by different payers', () => {
    it('should accumulate correctly when multiple people pay', () => {
      const expenses: Expense[] = [
        {
          id: '1', date: '2026-03-10', description: 'Dinner',
          amount: 400, currency: 'NIS', paid_by: 'Bloch',
          splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 },
        },
        {
          id: '2', date: '2026-03-11', description: 'Lunch',
          amount: 200, currency: 'NIS', paid_by: 'Adji',
          splits: { Bloch: 50, Adji: 50, Razi: 50, Kalish: 50 },
        },
        {
          id: '3', date: '2026-03-11', description: 'Taxi',
          amount: 100, currency: 'NIS', paid_by: 'Razi',
          splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
        },
      ];

      const balances = calculateBalances(expenses, []);
      const totalNet = balances.reduce((sum, b) => sum + b.net, 0);
      expect(totalNet).toBeCloseTo(0, 10);

      const bloch = balances.find(b => b.member === 'Bloch')!;
      expect(bloch.paid).toBe(400);
      expect(bloch.owes).toBe(175);
    });
  });

  describe('Multi-currency support', () => {
    it('should convert USD expenses to NIS', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Equipment',
        amount: 100, currency: 'USD', paid_by: 'Kalish',
        splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
      }];

      const balances = calculateBalances(expenses, []);
      const kalish = balances.find(b => b.member === 'Kalish')!;
      expect(kalish.paid).toBeCloseTo(100 * EXCHANGE_RATES.USD, 2);
      expect(kalish.owes).toBeCloseTo(25 * EXCHANGE_RATES.USD, 2);
    });

    it('should convert EUR expenses to NIS', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Ski pass',
        amount: 200, currency: 'EUR', paid_by: 'Adji',
        splits: { Bloch: 50, Adji: 50, Razi: 50, Kalish: 50 },
      }];

      const balances = calculateBalances(expenses, []);
      const adji = balances.find(b => b.member === 'Adji')!;
      expect(adji.paid).toBeCloseTo(200 * EXCHANGE_RATES.EUR, 2);
    });

    it('net balances should still sum to zero with mixed currencies', () => {
      const expenses: Expense[] = [
        {
          id: '1', date: '2026-03-10', description: 'Dinner',
          amount: 500, currency: 'NIS', paid_by: 'Bloch',
          splits: { Bloch: 125, Adji: 125, Razi: 125, Kalish: 125 },
        },
        {
          id: '2', date: '2026-03-10', description: 'Gear',
          amount: 200, currency: 'USD', paid_by: 'Razi',
          splits: { Bloch: 50, Adji: 50, Razi: 50, Kalish: 50 },
        },
        {
          id: '3', date: '2026-03-10', description: 'Tickets',
          amount: 150, currency: 'EUR', paid_by: 'Kalish',
          splits: { Bloch: 37.5, Adji: 37.5, Razi: 37.5, Kalish: 37.5 },
        },
      ];

      const balances = calculateBalances(expenses, []);
      const totalNet = balances.reduce((sum, b) => sum + b.net, 0);
      expect(totalNet).toBeCloseTo(0, 5);
    });
  });

  describe('Settlements affect balances correctly', () => {
    it('should reduce debt when settlement is recorded', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Dinner',
        amount: 400, currency: 'NIS', paid_by: 'Bloch',
        splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 },
      }];

      const settlements: Settlement[] = [{
        id: 's1', date: '2026-03-11',
        from_member: 'Adji', to_member: 'Bloch',
        amount: 100, currency: 'NIS',
      }];

      const balances = calculateBalances(expenses, settlements);
      const adji = balances.find(b => b.member === 'Adji')!;
      expect(adji.net).toBe(0);
    });

    it('should handle over-settlement (overpayment)', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Dinner',
        amount: 400, currency: 'NIS', paid_by: 'Bloch',
        splits: { Bloch: 100, Adji: 100, Razi: 100, Kalish: 100 },
      }];

      const settlements: Settlement[] = [{
        id: 's1', date: '2026-03-11',
        from_member: 'Adji', to_member: 'Bloch',
        amount: 150, currency: 'NIS',
      }];

      const balances = calculateBalances(expenses, settlements);
      const adji = balances.find(b => b.member === 'Adji')!;
      expect(adji.net).toBe(50);
    });

    it('should handle settlement in different currency', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Dinner',
        amount: 308, currency: 'NIS', paid_by: 'Bloch',
        splits: { Bloch: 77, Adji: 77, Razi: 77, Kalish: 77 },
      }];

      const settlements: Settlement[] = [{
        id: 's1', date: '2026-03-11',
        from_member: 'Adji', to_member: 'Bloch',
        amount: 25, currency: 'USD',
      }];

      const balances = calculateBalances(expenses, settlements);
      const adji = balances.find(b => b.member === 'Adji')!;
      expect(adji.paid).toBeCloseTo(25 * EXCHANGE_RATES.USD, 2);
    });

    it('net should remain zero after full settlement cycle', () => {
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
      balances.forEach(b => {
        expect(b.net).toBeCloseTo(0, 10);
      });
    });
  });

  describe('Debt Simplification', () => {
    it('should return empty array when all balanced', () => {
      const balances: Balance[] = [
        { member: 'Bloch', paid: 100, owes: 100, net: 0 },
        { member: 'Adji', paid: 100, owes: 100, net: 0 },
        { member: 'Razi', paid: 100, owes: 100, net: 0 },
        { member: 'Kalish', paid: 100, owes: 100, net: 0 },
      ];
      expect(simplifyDebts(balances)).toEqual([]);
    });

    it('should produce fewer transactions than O(n²)', () => {
      const balances: Balance[] = [
        { member: 'Bloch', paid: 400, owes: 100, net: 300 },
        { member: 'Adji', paid: 0, owes: 100, net: -100 },
        { member: 'Razi', paid: 0, owes: 100, net: -100 },
        { member: 'Kalish', paid: 0, owes: 100, net: -100 },
      ];
      const debts = simplifyDebts(balances);
      expect(debts.length).toBeLessThanOrEqual(3);
    });

    it('should have all debt amounts positive', () => {
      const balances: Balance[] = [
        { member: 'Bloch', paid: 300, owes: 0, net: 300 },
        { member: 'Adji', paid: 0, owes: 200, net: -200 },
        { member: 'Razi', paid: 0, owes: 100, net: -100 },
        { member: 'Kalish', paid: 0, owes: 0, net: 0 },
      ];
      const debts = simplifyDebts(balances);
      debts.forEach(d => {
        expect(d.amount).toBeGreaterThan(0);
      });
    });

    it('debts should never have from === to', () => {
      const balances: Balance[] = [
        { member: 'Bloch', paid: 500, owes: 125, net: 375 },
        { member: 'Adji', paid: 0, owes: 125, net: -125 },
        { member: 'Razi', paid: 0, owes: 125, net: -125 },
        { member: 'Kalish', paid: 0, owes: 125, net: -125 },
      ];
      const debts = simplifyDebts(balances);
      debts.forEach(d => {
        expect(d.from).not.toBe(d.to);
      });
    });

    it('total debt flow should equal total owed', () => {
      const balances: Balance[] = [
        { member: 'Bloch', paid: 600, owes: 150, net: 450 },
        { member: 'Adji', paid: 100, owes: 200, net: -100 },
        { member: 'Razi', paid: 0, owes: 150, net: -150 },
        { member: 'Kalish', paid: 0, owes: 200, net: -200 },
      ];
      const debts = simplifyDebts(balances);
      const totalFlow = debts.reduce((sum, d) => sum + d.amount, 0);
      const totalOwed = balances.filter(b => b.net < 0).reduce((sum, b) => sum + Math.abs(b.net), 0);
      expect(totalFlow).toBeCloseTo(totalOwed, 2);
    });

    it('should ignore sub-penny rounding differences', () => {
      const balances: Balance[] = [
        { member: 'Bloch', paid: 100, owes: 100, net: 0.001 },
        { member: 'Adji', paid: 100, owes: 100, net: -0.001 },
        { member: 'Razi', paid: 100, owes: 100, net: 0 },
        { member: 'Kalish', paid: 100, owes: 100, net: 0 },
      ];
      const debts = simplifyDebts(balances);
      expect(debts).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty expense and settlement lists', () => {
      const balances = calculateBalances([], []);
      expect(balances).toHaveLength(4);
      balances.forEach(b => {
        expect(b.paid).toBe(0);
        expect(b.owes).toBe(0);
        expect(b.net).toBe(0);
      });
    });

    it('should handle only settlements with no expenses', () => {
      const settlements: Settlement[] = [{
        id: 's1', date: '2026-03-10',
        from_member: 'Adji', to_member: 'Bloch',
        amount: 100, currency: 'NIS',
      }];

      const balances = calculateBalances([], settlements);
      const adji = balances.find(b => b.member === 'Adji')!;
      expect(adji.paid).toBe(100);
      const bloch = balances.find(b => b.member === 'Bloch')!;
      expect(bloch.owes).toBe(100);
    });

    it('should handle a large number of expenses', () => {
      const expenses: Expense[] = Array.from({ length: 500 }, (_, i) => ({
        id: `e${i}`,
        date: '2026-03-10',
        description: `Expense ${i}`,
        amount: 100,
        currency: 'NIS' as const,
        paid_by: (['Bloch', 'Adji', 'Razi', 'Kalish'] as Member[])[i % 4],
        splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 } as Record<Member, number>,
      }));

      const balances = calculateBalances(expenses, []);
      const totalNet = balances.reduce((sum, b) => sum + b.net, 0);
      expect(totalNet).toBeCloseTo(0, 5);
    });

    it('should handle expense where one member owes everything', () => {
      const expenses: Expense[] = [{
        id: '1', date: '2026-03-10', description: 'Personal item',
        amount: 100, currency: 'NIS', paid_by: 'Bloch',
        splits: { Bloch: 0, Adji: 100, Razi: 0, Kalish: 0 },
      }];

      const balances = calculateBalances(expenses, []);
      const bloch = balances.find(b => b.member === 'Bloch')!;
      expect(bloch.net).toBe(100);
      const adji = balances.find(b => b.member === 'Adji')!;
      expect(adji.net).toBe(-100);
    });
  });
});

describe('Regression: Currency Formatting', () => {
  it('should format NIS with shekel symbol', () => {
    expect(formatCurrency(100, 'NIS')).toBe('₪100.00');
  });

  it('should format USD with dollar symbol', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00');
  });

  it('should format EUR with euro symbol', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€100.00');
  });

  it('should handle zero amount', () => {
    expect(formatNIS(0)).toBe('₪0.00');
  });

  it('should handle negative amount', () => {
    expect(formatNIS(-100)).toBe('₪-100.00');
  });

  it('should always show two decimal places', () => {
    expect(formatNIS(100)).toBe('₪100.00');
    expect(formatNIS(100.1)).toBe('₪100.10');
    expect(formatNIS(100.12)).toBe('₪100.12');
  });

  it('should handle very small amounts', () => {
    expect(formatNIS(0.01)).toBe('₪0.01');
  });

  it('should handle very large amounts', () => {
    expect(formatNIS(999999.99)).toBe('₪999999.99');
  });

  describe('toNIS conversions should match EXCHANGE_RATES config', () => {
    it('NIS stays 1:1', () => {
      expect(toNIS(100, 'NIS')).toBe(100);
    });

    it('USD uses config rate', () => {
      expect(toNIS(1, 'USD')).toBe(EXCHANGE_RATES.USD);
    });

    it('EUR uses config rate', () => {
      expect(toNIS(1, 'EUR')).toBe(EXCHANGE_RATES.EUR);
    });

    it('unknown currency defaults to 1:1', () => {
      expect(toNIS(100, 'GBP')).toBe(100);
    });
  });
});
