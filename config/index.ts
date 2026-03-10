import { Member, Currency } from '@/types';

export const MEMBERS: Member[] = ['Bloch', 'Adji', 'Razi'];

export const CURRENCIES: Currency[] = ['NIS', 'USD', 'EUR'];

export const EXCHANGE_RATES: Record<Currency, number> = {
  NIS: 1,
  USD: 3.65,
  EUR: 3.95,
};

export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Accommodation',
  'Equipment',
  'Activities',
  'Medical',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];
