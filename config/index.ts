import { Member, Currency } from '@/types';

export const MEMBERS: Member[] = ['Bloch', 'Adji', 'Razi', 'Kalish'];

export const CURRENCIES: Currency[] = ['NIS', 'USD', 'EUR'];

export const EXCHANGE_RATES: Record<Currency, number> = {
  NIS: 1,
  USD: 3.08,
  EUR: 3.60,
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

export const PHOTOS = [
  '/photos/ski-01.png',
  '/photos/ski-02.png',
  '/photos/ski-03.png',
  '/photos/ski-04.png',
  '/photos/ski-05.png',
  '/photos/ski-06.png',
  '/photos/ski-07.png',
  '/photos/ski-08.png',
  '/photos/ski-09.png',
  '/photos/ski-10.png',
  '/photos/ski-11.png',
] as const;
