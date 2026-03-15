import { Expense, Settlement, Member, Currency } from '@/types';
import { MEMBERS, CURRENCIES } from '@/config';

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_NOTE_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 50;
const MAX_AMOUNT = 1_000_000;
const MAX_EXPENSES = 10_000;
const MAX_SETTLEMENTS = 10_000;

function isValidMember(value: unknown): value is Member {
  return typeof value === 'string' && (MEMBERS as readonly string[]).includes(value);
}

function isValidCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_AMOUNT;
}

function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

function sanitizeString(input: string, maxLength: number): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>"'/]/g, '');
}

function isValidExpense(obj: unknown): obj is Expense {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
  const e = obj as Record<string, unknown>;

  if (typeof e.id !== 'string' || e.id.length === 0 || e.id.length > 50) return false;
  if (!isValidDateString(e.date)) return false;
  if (typeof e.description !== 'string' || e.description.length === 0) return false;
  if (!isValidAmount(e.amount)) return false;
  if (!isValidCurrency(e.currency)) return false;
  if (!isValidMember(e.paid_by)) return false;

  if (typeof e.splits !== 'object' || e.splits === null || Array.isArray(e.splits)) return false;
  const splits = e.splits as Record<string, unknown>;
  for (const key of Object.keys(splits)) {
    if (!isValidMember(key)) return false;
    if (!isValidAmount(splits[key])) return false;
  }

  if (e.category !== undefined && typeof e.category !== 'string') return false;

  return true;
}

function isValidSettlement(obj: unknown): obj is Settlement {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;

  if (typeof s.id !== 'string' || s.id.length === 0 || s.id.length > 50) return false;
  if (!isValidDateString(s.date)) return false;
  if (!isValidMember(s.from_member)) return false;
  if (!isValidMember(s.to_member)) return false;
  if (s.from_member === s.to_member) return false;
  if (!isValidAmount(s.amount)) return false;
  if (s.amount === 0) return false;
  if (!isValidCurrency(s.currency)) return false;

  if (s.note !== undefined && typeof s.note !== 'string') return false;

  return true;
}

export function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadExpenses(): Expense[] {
  const raw = localStorage.getItem('expenses');
  const parsed = safeParseJSON<unknown[]>(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidExpense).slice(0, MAX_EXPENSES);
}

export function loadSettlements(): Settlement[] {
  const raw = localStorage.getItem('settlements');
  const parsed = safeParseJSON<unknown[]>(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidSettlement).slice(0, MAX_SETTLEMENTS);
}

export function loadCurrentUser(): Member | null {
  const raw = localStorage.getItem('currentUser');
  if (isValidMember(raw)) return raw;
  localStorage.removeItem('currentUser');
  return null;
}

export function sanitizeExpenseInput(input: {
  description: string;
  amount: string;
  currency: Currency;
  paidBy: Member;
  splits: Record<Member, number>;
  category: string;
}): { valid: true; expense: Expense } | { valid: false; error: string } {
  const description = sanitizeString(input.description, MAX_DESCRIPTION_LENGTH);
  if (description.length === 0) {
    return { valid: false, error: 'Description is required' };
  }

  const amountNum = parseFloat(input.amount);
  if (isNaN(amountNum) || amountNum <= 0 || amountNum > MAX_AMOUNT) {
    return { valid: false, error: `Amount must be between 0.01 and ${MAX_AMOUNT.toLocaleString()}` };
  }

  if (!isValidCurrency(input.currency)) {
    return { valid: false, error: 'Invalid currency' };
  }

  if (!isValidMember(input.paidBy)) {
    return { valid: false, error: 'Invalid member' };
  }

  for (const [member, splitVal] of Object.entries(input.splits)) {
    if (!isValidMember(member)) return { valid: false, error: `Invalid member in split: ${member}` };
    if (!Number.isFinite(splitVal) || splitVal < 0 || splitVal > MAX_AMOUNT) {
      return { valid: false, error: `Invalid split amount for ${member}` };
    }
  }

  const category = sanitizeString(input.category, MAX_CATEGORY_LENGTH);

  const expense: Expense = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    description,
    amount: Math.round(amountNum * 100) / 100,
    currency: input.currency,
    paid_by: input.paidBy,
    splits: input.splits,
    category: category || undefined,
  };

  return { valid: true, expense };
}

export function sanitizeSettlementInput(input: {
  fromMember: Member;
  toMember: Member;
  amount: string;
  currency: Currency;
  note: string;
}): { valid: true; settlement: Settlement } | { valid: false; error: string } {
  if (!isValidMember(input.fromMember)) return { valid: false, error: 'Invalid from member' };
  if (!isValidMember(input.toMember)) return { valid: false, error: 'Invalid to member' };
  if (input.fromMember === input.toMember) return { valid: false, error: 'From and To must be different' };

  const amountNum = parseFloat(input.amount);
  if (isNaN(amountNum) || amountNum <= 0 || amountNum > MAX_AMOUNT) {
    return { valid: false, error: `Amount must be between 0.01 and ${MAX_AMOUNT.toLocaleString()}` };
  }

  if (!isValidCurrency(input.currency)) return { valid: false, error: 'Invalid currency' };

  const note = sanitizeString(input.note, MAX_NOTE_LENGTH);

  const settlement: Settlement = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    from_member: input.fromMember,
    to_member: input.toMember,
    amount: Math.round(amountNum * 100) / 100,
    currency: input.currency,
    note: note || undefined,
  };

  return { valid: true, settlement };
}
