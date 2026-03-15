/**
 * Regression tests for Supabase connectivity bugs.
 *
 * Bugs covered:
 *  - Supabase client created with undefined URL/key when env vars are missing
 *  - Dev vs production table separation via NEXT_PUBLIC_TABLE_PREFIX
 *  - Supabase CRUD functions gracefully return errors instead of crashing
 */

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

describe('Bug Fix: Supabase env var handling', () => {
  it('should use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = '';

    const { supabase } = require('@/lib/supabase');
    expect(supabase).toBeDefined();
    expect(supabase.supabaseUrl).toBe('https://test.supabase.co');
  });

  it('should throw when Supabase URL is empty', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = '';

    expect(() => {
      require('@/lib/supabase');
    }).toThrow();
  });
});

describe('Bug Fix: Dev vs production table prefix separation', () => {
  it('should use dev_ prefix for table names when NEXT_PUBLIC_TABLE_PREFIX=dev_', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = 'dev_';

    jest.resetModules();

    const supabaseModule = require('@/lib/supabase');

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    supabaseModule.supabase.from = mockFrom;

    await supabaseModule.fetchExpenses();
    expect(mockFrom).toHaveBeenCalledWith('dev_expenses');
  });

  it('should use bare table names when NEXT_PUBLIC_TABLE_PREFIX is empty', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = '';

    jest.resetModules();

    const supabaseModule = require('@/lib/supabase');

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    supabaseModule.supabase.from = mockFrom;

    await supabaseModule.fetchExpenses();
    expect(mockFrom).toHaveBeenCalledWith('expenses');
  });

  it('should use prefix for settlements table too', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = 'dev_';

    jest.resetModules();

    const supabaseModule = require('@/lib/supabase');

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    supabaseModule.supabase.from = mockFrom;

    await supabaseModule.fetchSettlements();
    expect(mockFrom).toHaveBeenCalledWith('dev_settlements');
  });
});

describe('Bug Fix: Dev vs production table prefix for activity_log', () => {
  it('should use dev_ prefix for activity_log when NEXT_PUBLIC_TABLE_PREFIX=dev_', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = 'dev_';

    jest.resetModules();

    const supabaseModule = require('@/lib/supabase');

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    supabaseModule.supabase.from = mockFrom;

    await supabaseModule.fetchActivityLog();
    expect(mockFrom).toHaveBeenCalledWith('dev_activity_log');
  });

  it('should use bare activity_log when NEXT_PUBLIC_TABLE_PREFIX is empty', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = '';

    jest.resetModules();

    const supabaseModule = require('@/lib/supabase');

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    supabaseModule.supabase.from = mockFrom;

    await supabaseModule.fetchActivityLog();
    expect(mockFrom).toHaveBeenCalledWith('activity_log');
  });
});

describe('Bug Fix: Supabase CRUD error handling', () => {
  let supabaseModule: typeof import('@/lib/supabase');
  const originalConsoleError = console.error;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_TABLE_PREFIX = '';
    jest.resetModules();
    supabaseModule = require('@/lib/supabase');
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('fetchExpenses should return [] when Supabase returns an error', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'relation "expenses" does not exist' },
        }),
      }),
    });

    const result = await supabaseModule.fetchExpenses();
    expect(result).toEqual([]);
  });

  it('fetchSettlements should return [] when Supabase returns an error', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'connection refused' },
        }),
      }),
    });

    const result = await supabaseModule.fetchSettlements();
    expect(result).toEqual([]);
  });

  it('insertExpense should return null when Supabase returns an error', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'invalid input syntax for type uuid' },
          }),
        }),
      }),
    });

    const expense = {
      id: 'bad-id',
      date: '2026-03-10',
      description: 'Test',
      amount: 100,
      currency: 'NIS' as const,
      paid_by: 'Bloch' as const,
      splits: { Bloch: 25, Adji: 25, Razi: 25, Kalish: 25 },
    };

    const result = await supabaseModule.insertExpense(expense as any);
    expect(result).toBeNull();
  });

  it('removeExpense should return false when Supabase returns an error', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'row not found' },
        }),
      }),
    });

    const result = await supabaseModule.removeExpense('nonexistent-id');
    expect(result).toBe(false);
  });

  it('insertSettlement should return null when Supabase returns an error', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'violates check constraint' },
          }),
        }),
      }),
    });

    const settlement = {
      id: 'test-id',
      date: '2026-03-10',
      from_member: 'Adji' as const,
      to_member: 'Bloch' as const,
      amount: 100,
      currency: 'NIS' as const,
    };

    const result = await supabaseModule.insertSettlement(settlement as any);
    expect(result).toBeNull();
  });

  it('removeSettlement should return false when Supabase returns an error', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'permission denied' },
        }),
      }),
    });

    const result = await supabaseModule.removeSettlement('nonexistent-id');
    expect(result).toBe(false);
  });

  it('fetchExpenses should map rows correctly on success', async () => {
    const mockRow = {
      id: 'uuid-1',
      date: '2026-03-10',
      description: 'Ski pass',
      amount: '150.50',
      currency: 'EUR',
      paid_by: 'Razi',
      splits: { Bloch: 37.625, Adji: 37.625, Razi: 37.625, Kalish: 37.625 },
      category: 'Activities',
    };

    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [mockRow], error: null }),
      }),
    });

    const result = await supabaseModule.fetchExpenses();
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(150.5);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].category).toBe('Activities');
  });

  it('fetchExpenses should handle null data as empty array', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    const result = await supabaseModule.fetchExpenses();
    expect(result).toEqual([]);
  });

  it('fetchActivityLog should return [] when Supabase returns an error', async () => {
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'relation "activity_log" does not exist' },
          }),
        }),
      }),
    });

    const result = await supabaseModule.fetchActivityLog();
    expect(result).toEqual([]);
  });

  it('fetchActivityLog should return rows on success', async () => {
    const mockRows = [
      { id: 1, ts: '2026-03-13T10:00:00Z', user_name: 'Bloch', action: 'login', details: null },
      { id: 2, ts: '2026-03-13T10:01:00Z', user_name: 'Adji', action: 'add_expense', details: { amount: 100 } },
    ];

    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: mockRows, error: null }),
        }),
      }),
    });

    const result = await supabaseModule.fetchActivityLog();
    expect(result).toHaveLength(2);
    expect(result[0].user_name).toBe('Bloch');
    expect(result[1].action).toBe('add_expense');
  });

  it('logActivity should call supabase insert without throwing', async () => {
    const mockInsert = jest.fn().mockReturnValue({
      then: jest.fn().mockImplementation((cb) => { cb({ error: null }); return { catch: jest.fn() }; }),
    });
    supabaseModule.supabase.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    supabaseModule.logActivity('Bloch', 'test_action', { foo: 'bar' });

    expect(supabaseModule.supabase.from).toHaveBeenCalledWith('activity_log');
    expect(mockInsert).toHaveBeenCalledWith({
      user_name: 'Bloch',
      action: 'test_action',
      details: { foo: 'bar' },
    });
  });
});
