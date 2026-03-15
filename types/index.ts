export type Member = 'Bloch' | 'Adji' | 'Razi' | 'Kalish';

export type Currency = 'NIS' | 'USD' | 'EUR';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  paid_by: Member;
  splits: Record<Member, number>;
  category?: string;
}

export interface Settlement {
  id: string;
  date: string;
  from_member: Member;
  to_member: Member;
  amount: number;
  currency: Currency;
  note?: string;
}

export interface Balance {
  member: Member;
  paid: number;
  owes: number;
  net: number;
}

export interface SimplifiedDebt {
  from: Member;
  to: Member;
  amount: number;
}
