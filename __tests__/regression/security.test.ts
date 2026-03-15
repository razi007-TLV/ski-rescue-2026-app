import {
  safeParseJSON,
  loadExpenses,
  loadSettlements,
  loadCurrentUser,
  sanitizeExpenseInput,
  sanitizeSettlementInput,
} from '@/lib/security';
import { MEMBERS } from '@/config';
import { Member, Currency } from '@/types';

beforeEach(() => {
  localStorage.clear();
});

describe('Security: Input Sanitization', () => {
  describe('sanitizeExpenseInput', () => {
    const validInput = {
      description: 'Ski lift tickets',
      amount: '100',
      currency: 'NIS' as Currency,
      paidBy: 'Bloch' as Member,
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 } as Record<Member, number>,
      category: 'Activities',
    };

    it('should accept valid input', () => {
      const result = sanitizeExpenseInput(validInput);
      expect(result.valid).toBe(true);
    });

    it('should reject empty description', () => {
      const result = sanitizeExpenseInput({ ...validInput, description: '' });
      expect(result.valid).toBe(false);
    });

    it('should reject whitespace-only description', () => {
      const result = sanitizeExpenseInput({ ...validInput, description: '   ' });
      expect(result.valid).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = sanitizeExpenseInput({ ...validInput, amount: '0' });
      expect(result.valid).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = sanitizeExpenseInput({ ...validInput, amount: '-50' });
      expect(result.valid).toBe(false);
    });

    it('should reject amount over MAX_AMOUNT', () => {
      const result = sanitizeExpenseInput({ ...validInput, amount: '2000000' });
      expect(result.valid).toBe(false);
    });

    it('should reject non-numeric amount', () => {
      const result = sanitizeExpenseInput({ ...validInput, amount: 'abc' });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid currency', () => {
      const result = sanitizeExpenseInput({ ...validInput, currency: 'GBP' as Currency });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid member', () => {
      const result = sanitizeExpenseInput({ ...validInput, paidBy: 'Hacker' as Member });
      expect(result.valid).toBe(false);
    });

    it('should strip HTML tags from description', () => {
      const result = sanitizeExpenseInput({
        ...validInput,
        description: '<script>alert("xss")</script>Dinner',
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.expense.description).not.toContain('<script>');
        expect(result.expense.description).not.toContain('</script>');
      }
    });

    it('should truncate overly long description', () => {
      const result = sanitizeExpenseInput({
        ...validInput,
        description: 'A'.repeat(500),
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.expense.description.length).toBeLessThanOrEqual(200);
      }
    });

    it('should round amount to 2 decimal places', () => {
      const result = sanitizeExpenseInput({ ...validInput, amount: '100.999' });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.expense.amount).toBe(101);
      }
    });

    it('should generate unique IDs', () => {
      const r1 = sanitizeExpenseInput(validInput);
      const r2 = sanitizeExpenseInput(validInput);
      expect(r1.valid && r2.valid).toBe(true);
      if (r1.valid && r2.valid) {
        expect(r1.expense.id).not.toBe(r2.expense.id);
      }
    });

    it('should reject negative split amounts', () => {
      const result = sanitizeExpenseInput({
        ...validInput,
        splits: { Bloch: -50, Adji: 50, Razi: 50, Kalish: 50 },
      });
      expect(result.valid).toBe(false);
    });

    it('should reject NaN split amounts', () => {
      const result = sanitizeExpenseInput({
        ...validInput,
        splits: { Bloch: NaN, Adji: 25, Razi: 25, Kalish: 25 },
      });
      expect(result.valid).toBe(false);
    });

    it('should reject Infinity split amounts', () => {
      const result = sanitizeExpenseInput({
        ...validInput,
        splits: { Bloch: Infinity, Adji: 25, Razi: 25, Kalish: 25 },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeSettlementInput', () => {
    const validInput = {
      fromMember: 'Adji' as Member,
      toMember: 'Bloch' as Member,
      amount: '100',
      currency: 'NIS' as Currency,
      note: 'Cash payment',
    };

    it('should accept valid input', () => {
      const result = sanitizeSettlementInput(validInput);
      expect(result.valid).toBe(true);
    });

    it('should reject same from and to member', () => {
      const result = sanitizeSettlementInput({ ...validInput, toMember: 'Adji' as Member });
      expect(result.valid).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = sanitizeSettlementInput({ ...validInput, amount: '0' });
      expect(result.valid).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = sanitizeSettlementInput({ ...validInput, amount: '-100' });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid from_member', () => {
      const result = sanitizeSettlementInput({ ...validInput, fromMember: 'Eve' as Member });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid to_member', () => {
      const result = sanitizeSettlementInput({ ...validInput, toMember: 'Eve' as Member });
      expect(result.valid).toBe(false);
    });

    it('should strip HTML from note', () => {
      const result = sanitizeSettlementInput({
        ...validInput,
        note: '<img src=x onerror=alert(1)>payment',
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.settlement.note).not.toContain('<img');
      }
    });
  });
});

describe('Security: Data Loading from localStorage', () => {
  describe('safeParseJSON', () => {
    it('should return null for null input', () => {
      expect(safeParseJSON(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(safeParseJSON('')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(safeParseJSON('not json at all')).toBeNull();
    });

    it('should parse valid JSON', () => {
      expect(safeParseJSON('{"a":1}')).toEqual({ a: 1 });
    });

    it('should parse arrays', () => {
      expect(safeParseJSON('[1,2,3]')).toEqual([1, 2, 3]);
    });
  });

  describe('loadExpenses', () => {
    it('should return empty array when localStorage is empty', () => {
      expect(loadExpenses()).toEqual([]);
    });

    it('should return empty array for corrupted data', () => {
      localStorage.setItem('expenses', 'corrupted data');
      expect(loadExpenses()).toEqual([]);
    });

    it('should return empty array for non-array JSON', () => {
      localStorage.setItem('expenses', '{"not": "an array"}');
      expect(loadExpenses()).toEqual([]);
    });

    it('should filter out invalid expenses', () => {
      const data = [
        { id: '1', date: '2026-03-10', description: 'Valid', amount: 100, currency: 'NIS', paid_by: 'Bloch', splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 } },
        { id: '', date: '2026-03-10', description: 'Invalid ID', amount: 100, currency: 'NIS', paid_by: 'Bloch', splits: {} },
        { id: '3', description: 'Missing date', amount: 100, currency: 'NIS', paid_by: 'Bloch', splits: {} },
        'not an object',
        null,
      ];
      localStorage.setItem('expenses', JSON.stringify(data));
      const result = loadExpenses();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter expenses with invalid member names', () => {
      const data = [
        { id: '1', date: '2026-03-10', description: 'Valid', amount: 100, currency: 'NIS', paid_by: 'HackerMember', splits: { Bloch: 100 } },
      ];
      localStorage.setItem('expenses', JSON.stringify(data));
      expect(loadExpenses()).toEqual([]);
    });

    it('should limit number of expenses loaded', () => {
      const expenses = Array.from({ length: 15000 }, (_, i) => ({
        id: `id-${i}`,
        date: '2026-03-10',
        description: `Expense ${i}`,
        amount: 10,
        currency: 'NIS',
        paid_by: 'Bloch',
        splits: { Bloch: 2.5, Adji: 2.5, Razi: 2.5, Kalish: 2.5 },
      }));
      localStorage.setItem('expenses', JSON.stringify(expenses));
      const result = loadExpenses();
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('loadSettlements', () => {
    it('should return empty array when localStorage is empty', () => {
      expect(loadSettlements()).toEqual([]);
    });

    it('should return empty array for corrupted data', () => {
      localStorage.setItem('settlements', '{broken');
      expect(loadSettlements()).toEqual([]);
    });

    it('should filter out settlements where from === to', () => {
      const data = [
        { id: '1', date: '2026-03-10', from_member: 'Bloch', to_member: 'Bloch', amount: 100, currency: 'NIS' },
      ];
      localStorage.setItem('settlements', JSON.stringify(data));
      expect(loadSettlements()).toEqual([]);
    });

    it('should filter out settlements with zero amount', () => {
      const data = [
        { id: '1', date: '2026-03-10', from_member: 'Adji', to_member: 'Bloch', amount: 0, currency: 'NIS' },
      ];
      localStorage.setItem('settlements', JSON.stringify(data));
      expect(loadSettlements()).toEqual([]);
    });
  });

  describe('loadCurrentUser', () => {
    it('should return null when no user is set', () => {
      expect(loadCurrentUser()).toBeNull();
    });

    it('should return valid member name', () => {
      localStorage.setItem('currentUser', 'Bloch');
      expect(loadCurrentUser()).toBe('Bloch');
    });

    it('should return null and clean up invalid member', () => {
      localStorage.setItem('currentUser', 'InvalidName');
      expect(loadCurrentUser()).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });

    it('should handle all valid members', () => {
      for (const member of MEMBERS) {
        localStorage.setItem('currentUser', member);
        expect(loadCurrentUser()).toBe(member);
      }
    });
  });
});
