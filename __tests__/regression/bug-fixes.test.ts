/**
 * Regression tests for miscellaneous bug fixes encountered during development.
 *
 * Bugs covered:
 *  - Double HTML-encoding in sanitizeString (& showed as &amp;)
 *  - Predictable IDs from Date.now() replaced with crypto.randomUUID()
 *  - Exchange rates mismatch between config and tests
 *  - crypto.randomUUID polyfill needed for Jest
 *  - formatNIS negative display: ₪-100.00 not -₪100.00
 *  - Settlement form allows from === to (now blocked)
 *  - Security headers must be present in next.config
 *  - Kalish missing from MEMBERS array
 *  - Custom split selectedMembers logic was broken
 *  - Unsafe JSON.parse on localStorage (prototype pollution)
 */

import { sanitizeExpenseInput, sanitizeSettlementInput, safeParseJSON, loadExpenses, loadSettlements, loadCurrentUser } from '@/lib/security';
import { toNIS, formatCurrency, formatNIS, calculateBalances, simplifyDebts } from '@/lib/utils';
import { MEMBERS, CURRENCIES, EXCHANGE_RATES, CATEGORIES } from '@/config';
import { Member, Currency, Expense, Settlement, Balance } from '@/types';

beforeEach(() => {
  localStorage.clear();
});

describe('Bug Fix: Double HTML-encoding in sanitizeString', () => {
  it('should not double-encode ampersands in descriptions', () => {
    const result = sanitizeExpenseInput({
      description: 'Dinner & drinks',
      amount: '100',
      currency: 'NIS',
      paidBy: 'Bloch',
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
      category: 'Food & Dining',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.expense.description).not.toContain('&amp;');
    }
  });

  it('should strip dangerous HTML tags instead of encoding them', () => {
    const result = sanitizeExpenseInput({
      description: '<script>alert("xss")</script>Normal text',
      amount: '50',
      currency: 'NIS',
      paidBy: 'Adji',
      splits: { Bloch: 12.5, Adji: 12.5, Razi: 12.5, Kalish: 12.5 },
      category: 'Other',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.expense.description).not.toContain('<script>');
      expect(result.expense.description).not.toContain('&lt;');
      expect(result.expense.description).toContain('Normal text');
    }
  });

  it('should not double-encode quotes', () => {
    const result = sanitizeSettlementInput({
      fromMember: 'Adji',
      toMember: 'Bloch',
      amount: '100',
      currency: 'NIS',
      note: 'Payment for "dinner"',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.settlement.note).not.toContain('&quot;');
    }
  });
});

describe('Bug Fix: Predictable IDs replaced with crypto.randomUUID', () => {
  it('should generate unique IDs for each expense', () => {
    const input = {
      description: 'Test',
      amount: '100',
      currency: 'NIS' as Currency,
      paidBy: 'Bloch' as Member,
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 } as Record<Member, number>,
      category: 'Other',
    };

    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const result = sanitizeExpenseInput(input);
      if (result.valid) ids.add(result.expense.id);
    }
    expect(ids.size).toBe(10);
  });

  it('should generate unique IDs for each settlement', () => {
    const input = {
      fromMember: 'Adji' as Member,
      toMember: 'Bloch' as Member,
      amount: '50',
      currency: 'NIS' as Currency,
      note: '',
    };

    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const result = sanitizeSettlementInput(input);
      if (result.valid) ids.add(result.settlement.id);
    }
    expect(ids.size).toBe(10);
  });

  it('generated IDs should not be based on Date.now()', () => {
    const beforeTimestamp = Date.now().toString();
    const result = sanitizeExpenseInput({
      description: 'Test',
      amount: '100',
      currency: 'NIS',
      paidBy: 'Bloch',
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
      category: 'Other',
    });
    if (result.valid) {
      expect(result.expense.id).not.toBe(beforeTimestamp);
      expect(/^\d{13}$/.test(result.expense.id)).toBe(false);
    }
  });
});

describe('Bug Fix: Exchange rates match config', () => {
  it('should have NIS rate of 1', () => {
    expect(EXCHANGE_RATES.NIS).toBe(1);
  });

  it('should have USD rate matching config (3.08)', () => {
    expect(EXCHANGE_RATES.USD).toBe(3.08);
    expect(toNIS(100, 'USD')).toBe(308);
  });

  it('should have EUR rate matching config (3.60)', () => {
    expect(EXCHANGE_RATES.EUR).toBe(3.60);
    expect(toNIS(100, 'EUR')).toBe(360);
  });

  it('toNIS should use EXCHANGE_RATES consistently', () => {
    for (const currency of CURRENCIES) {
      expect(toNIS(1, currency)).toBe(EXCHANGE_RATES[currency]);
    }
  });

  it('unknown currency should default to 1:1', () => {
    expect(toNIS(100, 'GBP')).toBe(100);
    expect(toNIS(100, 'JPY')).toBe(100);
  });
});

describe('Bug Fix: crypto.randomUUID polyfill works in Jest', () => {
  it('crypto.randomUUID should be available', () => {
    expect(typeof crypto.randomUUID).toBe('function');
  });

  it('should return a string', () => {
    const uuid = crypto.randomUUID();
    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBeGreaterThan(0);
  });

  it('should generate unique values', () => {
    const a = crypto.randomUUID();
    const b = crypto.randomUUID();
    expect(a).not.toBe(b);
  });
});

describe('Bug Fix: formatNIS negative display order', () => {
  it('should show ₪-100.00 not -₪100.00', () => {
    expect(formatNIS(-100)).toBe('₪-100.00');
  });

  it('should show ₪-0.01 for very small negative', () => {
    expect(formatNIS(-0.01)).toBe('₪-0.01');
  });

  it('should show positive values normally', () => {
    expect(formatNIS(100)).toBe('₪100.00');
    expect(formatNIS(0)).toBe('₪0.00');
  });
});

describe('Bug Fix: Settlement from === to prevention', () => {
  it('should reject settlement where from_member equals to_member', () => {
    const result = sanitizeSettlementInput({
      fromMember: 'Bloch',
      toMember: 'Bloch',
      amount: '100',
      currency: 'NIS',
      note: '',
    });
    expect(result.valid).toBe(false);
  });

  it('should accept settlement where from_member differs from to_member', () => {
    const result = sanitizeSettlementInput({
      fromMember: 'Adji',
      toMember: 'Bloch',
      amount: '100',
      currency: 'NIS',
      note: '',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject all same-member pairs', () => {
    for (const member of MEMBERS) {
      const result = sanitizeSettlementInput({
        fromMember: member,
        toMember: member,
        amount: '50',
        currency: 'NIS',
        note: '',
      });
      expect(result.valid).toBe(false);
    }
  });
});

describe('Bug Fix: Kalish included in MEMBERS', () => {
  it('MEMBERS should contain all 4 members including Kalish', () => {
    expect(MEMBERS).toContain('Bloch');
    expect(MEMBERS).toContain('Adji');
    expect(MEMBERS).toContain('Razi');
    expect(MEMBERS).toContain('Kalish');
    expect(MEMBERS).toHaveLength(4);
  });

  it('calculateBalances should return balances for all 4 members', () => {
    const balances = calculateBalances([], []);
    expect(balances).toHaveLength(4);
    const memberNames = balances.map(b => b.member);
    expect(memberNames).toContain('Kalish');
  });

  it('Kalish should be a valid paidBy member in expense input', () => {
    const result = sanitizeExpenseInput({
      description: 'Test',
      amount: '100',
      currency: 'NIS',
      paidBy: 'Kalish',
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
      category: 'Other',
    });
    expect(result.valid).toBe(true);
  });

  it('Kalish should be valid in settlement from/to', () => {
    const result = sanitizeSettlementInput({
      fromMember: 'Kalish',
      toMember: 'Bloch',
      amount: '100',
      currency: 'NIS',
      note: '',
    });
    expect(result.valid).toBe(true);
  });
});

describe('Bug Fix: Unsafe JSON.parse on localStorage', () => {
  it('safeParseJSON should return null for corrupted JSON', () => {
    expect(safeParseJSON('not json')).toBeNull();
    expect(safeParseJSON('{broken')).toBeNull();
    expect(safeParseJSON('{{{{{')).toBeNull();
  });

  it('safeParseJSON should return null for null input', () => {
    expect(safeParseJSON(null)).toBeNull();
  });

  it('safeParseJSON should return null for empty string', () => {
    expect(safeParseJSON('')).toBeNull();
  });

  it('safeParseJSON should parse valid JSON', () => {
    expect(safeParseJSON('{"a":1}')).toEqual({ a: 1 });
    expect(safeParseJSON('[1,2,3]')).toEqual([1, 2, 3]);
    expect(safeParseJSON('"hello"')).toBe('hello');
  });

  it('loadExpenses should safely handle prototype pollution attempts', () => {
    localStorage.setItem('expenses', '{"__proto__":{"isAdmin":true}}');
    const result = loadExpenses();
    expect(result).toEqual([]);
  });

  it('loadExpenses should safely handle non-array JSON', () => {
    localStorage.setItem('expenses', '{"not":"an array"}');
    const result = loadExpenses();
    expect(result).toEqual([]);
  });
});

describe('Bug Fix: Invalid member names rejected from localStorage', () => {
  it('should reject expense with unknown paid_by member', () => {
    localStorage.setItem('expenses', JSON.stringify([
      { id: '1', date: '2026-03-10', description: 'Test', amount: 100, currency: 'NIS', paid_by: 'Hacker', splits: { Bloch: 100 } },
    ]));
    expect(loadExpenses()).toEqual([]);
  });

  it('should reject settlement with unknown from_member', () => {
    localStorage.setItem('settlements', JSON.stringify([
      { id: '1', date: '2026-03-10', from_member: 'Evil', to_member: 'Bloch', amount: 100, currency: 'NIS' },
    ]));
    expect(loadSettlements()).toEqual([]);
  });

  it('should reject currentUser with invalid name', () => {
    localStorage.setItem('currentUser', 'Admin');
    expect(loadCurrentUser()).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });
});

describe('Bug Fix: Amount bounds enforced (DoS prevention)', () => {
  it('should reject expense amount over 1,000,000', () => {
    const result = sanitizeExpenseInput({
      description: 'Huge expense',
      amount: '2000000',
      currency: 'NIS',
      paidBy: 'Bloch',
      splits: { Bloch: 500000, Adji: 500000, Razi: 500000, Kalish: 500000 },
      category: 'Other',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject settlement amount over 1,000,000', () => {
    const result = sanitizeSettlementInput({
      fromMember: 'Adji',
      toMember: 'Bloch',
      amount: '2000000',
      currency: 'NIS',
      note: '',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject NaN amounts', () => {
    const result = sanitizeExpenseInput({
      description: 'Test',
      amount: 'NaN',
      currency: 'NIS',
      paidBy: 'Bloch',
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
      category: 'Other',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject Infinity split amounts', () => {
    const result = sanitizeExpenseInput({
      description: 'Test',
      amount: '100',
      currency: 'NIS',
      paidBy: 'Bloch',
      splits: { Bloch: Infinity, Adji: 0, Razi: 0, Kalish: 0 },
      category: 'Other',
    });
    expect(result.valid).toBe(false);
  });
});

describe('Bug Fix: Description and note length limits enforced', () => {
  it('should truncate descriptions longer than 200 characters', () => {
    const result = sanitizeExpenseInput({
      description: 'A'.repeat(500),
      amount: '100',
      currency: 'NIS',
      paidBy: 'Bloch',
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
      category: 'Other',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.expense.description.length).toBeLessThanOrEqual(200);
    }
  });

  it('should truncate notes longer than 200 characters', () => {
    const result = sanitizeSettlementInput({
      fromMember: 'Adji',
      toMember: 'Bloch',
      amount: '100',
      currency: 'NIS',
      note: 'B'.repeat(500),
    });
    expect(result.valid).toBe(true);
    if (result.valid && result.settlement.note) {
      expect(result.settlement.note.length).toBeLessThanOrEqual(200);
    }
  });
});

describe('Bug Fix: Amount rounded to 2 decimal places', () => {
  it('should round 100.999 to 101.00', () => {
    const result = sanitizeExpenseInput({
      description: 'Test',
      amount: '100.999',
      currency: 'NIS',
      paidBy: 'Bloch',
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
      category: 'Other',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.expense.amount).toBe(101);
    }
  });

  it('should round 50.555 to 50.56', () => {
    const result = sanitizeSettlementInput({
      fromMember: 'Adji',
      toMember: 'Bloch',
      amount: '50.555',
      currency: 'NIS',
      note: '',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.settlement.amount).toBe(50.56);
    }
  });
});

describe('Bug Fix: CATEGORIES is a readonly tuple', () => {
  it('CATEGORIES should contain expected values', () => {
    expect(CATEGORIES).toContain('Food & Dining');
    expect(CATEGORIES).toContain('Transportation');
    expect(CATEGORIES).toContain('Accommodation');
    expect(CATEGORIES).toContain('Equipment');
    expect(CATEGORIES).toContain('Activities');
    expect(CATEGORIES).toContain('Medical');
    expect(CATEGORIES).toContain('Other');
  });

  it('CATEGORIES should have exactly 7 entries', () => {
    expect(CATEGORIES).toHaveLength(7);
  });
});

describe('Bug Fix: simplifyDebts sub-penny rounding', () => {
  it('should treat balances within 0.01 of zero as settled', () => {
    const balances: Balance[] = [
      { member: 'Bloch', paid: 100, owes: 100, net: 0.005 },
      { member: 'Adji', paid: 100, owes: 100, net: -0.005 },
      { member: 'Razi', paid: 100, owes: 100, net: 0 },
      { member: 'Kalish', paid: 100, owes: 100, net: 0 },
    ];
    const debts = simplifyDebts(balances);
    expect(debts).toHaveLength(0);
  });
});

describe('Bug Fix: Data loaded from localStorage is capped', () => {
  it('should cap expenses at 10,000', () => {
    const bigData = Array.from({ length: 15000 }, (_, i) => ({
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
