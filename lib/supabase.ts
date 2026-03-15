import { createClient } from '@supabase/supabase-js';
import { Expense, Settlement } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const tablePrefix = process.env.NEXT_PUBLIC_TABLE_PREFIX || '';

const TABLES = {
  expenses: `${tablePrefix}expenses`,
  settlements: `${tablePrefix}settlements`,
  activity_log: `${tablePrefix}activity_log`,
} as const;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from(TABLES.expenses)
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    paid_by: row.paid_by,
    splits: row.splits,
    category: row.category || undefined,
  }));
}

export async function insertExpense(expense: Expense): Promise<Expense | null> {
  const { data, error } = await supabase
    .from(TABLES.expenses)
    .insert({
      id: expense.id,
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      paid_by: expense.paid_by,
      splits: expense.splits,
      category: expense.category || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting expense:', error.message);
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    description: data.description,
    amount: Number(data.amount),
    currency: data.currency,
    paid_by: data.paid_by,
    splits: data.splits,
    category: data.category || undefined,
  };
}

export async function removeExpense(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLES.expenses)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error.message);
    return false;
  }
  return true;
}

export async function fetchSettlements(): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from(TABLES.settlements)
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching settlements:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    date: row.date,
    from_member: row.from_member,
    to_member: row.to_member,
    amount: Number(row.amount),
    currency: row.currency,
    note: row.note || undefined,
  }));
}

export async function insertSettlement(settlement: Settlement): Promise<Settlement | null> {
  const { data, error } = await supabase
    .from(TABLES.settlements)
    .insert({
      id: settlement.id,
      date: settlement.date,
      from_member: settlement.from_member,
      to_member: settlement.to_member,
      amount: settlement.amount,
      currency: settlement.currency,
      note: settlement.note || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting settlement:', error.message);
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    from_member: data.from_member,
    to_member: data.to_member,
    amount: Number(data.amount),
    currency: data.currency,
    note: data.note || undefined,
  };
}

export async function removeSettlement(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLES.settlements)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting settlement:', error.message);
    return false;
  }
  return true;
}

export interface ActivityLogEntry {
  id?: number;
  ts?: string;
  user_name: string;
  action: string;
  details?: Record<string, unknown> | null;
}

export function logActivity(
  user: string,
  action: string,
  details?: Record<string, unknown>
) {
  supabase
    .from(TABLES.activity_log)
    .insert({ user_name: user, action, details: details ?? null })
    .then(({ error }) => {
      if (error) console.error('Log error:', error.message);
    });
}

export async function fetchActivityLog(): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from(TABLES.activity_log)
    .select('*')
    .order('ts', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching activity log:', error.message);
    return [];
  }

  return data || [];
}
