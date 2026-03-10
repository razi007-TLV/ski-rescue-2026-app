import { 
  toNIS, 
  formatCurrency, 
  formatNIS, 
  calculateBalances, 
  simplifyDebts 
} from '@/lib/utils';
import { Expense, Settlement, Member } from '@/types';

describe('Currency Utilities', () => {
  describe('toNIS', () => {
    it('should convert USD to NIS', () => {
      expect(toNIS(100, 'USD')).toBe(365);
    });

    it('should convert EUR to NIS', () => {
      expect(toNIS(100, 'EUR')).toBe(395);
    });

    it('should return same amount for NIS', () => {
      expect(toNIS(100, 'NIS')).toBe(100);
    });

    it('should handle unknown currency as 1:1', () => {
      expect(toNIS(100, 'GBP')).toBe(100);
    });
  });

  describe('formatCurrency', () => {
    it('should format NIS correctly', () => {
      expect(formatCurrency(100.5, 'NIS')).toBe('₪100.50');
    });

    it('should format USD correctly', () => {
      expect(formatCurrency(100.5, 'USD')).toBe('$100.50');
    });

    it('should format EUR correctly', () => {
      expect(formatCurrency(100.5, 'EUR')).toBe('€100.50');
    });
  });

  describe('formatNIS', () => {
    it('should format NIS amount', () => {
      expect(formatNIS(100.5)).toBe('₪100.50');
    });

    it('should format with two decimal places', () => {
      expect(formatNIS(100)).toBe('₪100.00');
    });
  });
});

describe('Balance Calculations', () => {
  describe('calculateBalances', () => {
    it('should calculate balances with equal split', () => {
      const expenses: Expense[] = [
        {
          id: '1',
          date: '2026-03-10',
          description: 'Dinner',
          amount: 300,
          currency: 'NIS',
          paid_by: 'Bloch',
          splits: { Bloch: 100, Adji: 100, Razi: 100 },
        },
      ];

      const balances = calculateBalances(expenses, []);

      expect(balances).toEqual([
        { member: 'Bloch', paid: 300, owes: 100, net: 200 },
        { member: 'Adji', paid: 0, owes: 100, net: -100 },
        { member: 'Razi', paid: 0, owes: 100, net: -100 },
      ]);
    });

    it('should calculate balances with custom split', () => {
      const expenses: Expense[] = [
        {
          id: '1',
          date: '2026-03-10',
          description: 'Dinner',
          amount: 300,
          currency: 'NIS',
          paid_by: 'Bloch',
          splits: { Bloch: 150, Adji: 100, Razi: 50 },
        },
      ];

      const balances = calculateBalances(expenses, []);

      expect(balances).toEqual([
        { member: 'Bloch', paid: 300, owes: 150, net: 150 },
        { member: 'Adji', paid: 0, owes: 100, net: -100 },
        { member: 'Razi', paid: 0, owes: 50, net: -50 },
      ]);
    });

    it('should handle multiple expenses', () => {
      const expenses: Expense[] = [
        {
          id: '1',
          date: '2026-03-10',
          description: 'Dinner',
          amount: 300,
          currency: 'NIS',
          paid_by: 'Bloch',
          splits: { Bloch: 100, Adji: 100, Razi: 100 },
        },
        {
          id: '2',
          date: '2026-03-10',
          description: 'Lunch',
          amount: 150,
          currency: 'NIS',
          paid_by: 'Adji',
          splits: { Bloch: 50, Adji: 50, Razi: 50 },
        },
      ];

      const balances = calculateBalances(expenses, []);

      expect(balances).toEqual([
        { member: 'Bloch', paid: 300, owes: 150, net: 150 },
        { member: 'Adji', paid: 150, owes: 150, net: 0 },
        { member: 'Razi', paid: 0, owes: 150, net: -150 },
      ]);
    });

    it('should handle currency conversion', () => {
      const expenses: Expense[] = [
        {
          id: '1',
          date: '2026-03-10',
          description: 'Dinner',
          amount: 100,
          currency: 'USD',
          paid_by: 'Bloch',
          splits: { Bloch: 33.33, Adji: 33.33, Razi: 33.34 },
        },
      ];

      const balances = calculateBalances(expenses, []);

      expect(balances[0].paid).toBeCloseTo(365, 0);
      expect(balances[0].owes).toBeCloseTo(121.65, 1);
      expect(balances[0].net).toBeCloseTo(243.35, 1);
    });

    it('should include settlements in balance calculation', () => {
      const expenses: Expense[] = [
        {
          id: '1',
          date: '2026-03-10',
          description: 'Dinner',
          amount: 300,
          currency: 'NIS',
          paid_by: 'Bloch',
          splits: { Bloch: 100, Adji: 100, Razi: 100 },
        },
      ];

      const settlements: Settlement[] = [
        {
          id: '1',
          date: '2026-03-10',
          from_member: 'Adji',
          to_member: 'Bloch',
          amount: 100,
          currency: 'NIS',
        },
      ];

      const balances = calculateBalances(expenses, settlements);

      expect(balances).toEqual([
        { member: 'Bloch', paid: 300, owes: 200, net: 100 },
        { member: 'Adji', paid: 100, owes: 100, net: 0 },
        { member: 'Razi', paid: 0, owes: 100, net: -100 },
      ]);
    });
  });

  describe('simplifyDebts', () => {
    it('should simplify debts with one creditor and one debtor', () => {
      const balances = [
        { member: 'Bloch' as Member, paid: 300, owes: 100, net: 200 },
        { member: 'Adji' as Member, paid: 0, owes: 100, net: -100 },
        { member: 'Razi' as Member, paid: 0, owes: 100, net: -100 },
      ];

      const debts = simplifyDebts(balances);

      expect(debts).toHaveLength(2);
      expect(debts).toContainEqual({
        from: 'Adji',
        to: 'Bloch',
        amount: 100,
      });
      expect(debts).toContainEqual({
        from: 'Razi',
        to: 'Bloch',
        amount: 100,
      });
    });

    it('should simplify complex debts efficiently', () => {
      const balances = [
        { member: 'Bloch' as Member, paid: 300, owes: 150, net: 150 },
        { member: 'Adji' as Member, paid: 150, owes: 150, net: 0 },
        { member: 'Razi' as Member, paid: 0, owes: 150, net: -150 },
      ];

      const debts = simplifyDebts(balances);

      expect(debts).toHaveLength(1);
      expect(debts[0]).toEqual({
        from: 'Razi',
        to: 'Bloch',
        amount: 150,
      });
    });

    it('should return empty array when all balanced', () => {
      const balances = [
        { member: 'Bloch' as Member, paid: 100, owes: 100, net: 0 },
        { member: 'Adji' as Member, paid: 100, owes: 100, net: 0 },
        { member: 'Razi' as Member, paid: 100, owes: 100, net: 0 },
      ];

      const debts = simplifyDebts(balances);

      expect(debts).toHaveLength(0);
    });

    it('should handle small rounding errors', () => {
      const balances = [
        { member: 'Bloch' as Member, paid: 100, owes: 100, net: 0.005 },
        { member: 'Adji' as Member, paid: 100, owes: 100, net: -0.005 },
        { member: 'Razi' as Member, paid: 100, owes: 100, net: 0 },
      ];

      const debts = simplifyDebts(balances);

      expect(debts).toHaveLength(0);
    });
  });
});
