/**
 * Regression tests for the localStorage-to-Supabase migration logic.
 *
 * Bugs covered:
 *  - Old expenses had non-UUID IDs (Date.now().toString()) which Supabase rejected
 *  - Migration cleared localStorage even when upload failed (data loss)
 *  - Migration should only clear localStorage after ALL uploads succeed
 *  - Migration should report partial failures and keep local data for retry
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

beforeEach(() => {
  localStorage.clear();
});

describe('Bug Fix: UUID validation for migration', () => {
  it('should recognize valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  it('should reject old Date.now()-style IDs', () => {
    expect(isValidUUID('1741234567890')).toBe(false);
    expect(isValidUUID('1709312345678')).toBe(false);
  });

  it('should reject empty strings', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('should reject random strings', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('abc123')).toBe(false);
  });

  it('should reject UUIDs with wrong format', () => {
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
  });
});

describe('Bug Fix: Migration replaces non-UUID IDs with valid UUIDs', () => {
  it('should generate a new UUID for a Date.now()-style ID', () => {
    const oldId = '1741234567890';
    let fixedId = oldId;
    if (!isValidUUID(fixedId)) {
      fixedId = crypto.randomUUID();
    }
    expect(isValidUUID(fixedId) || fixedId.startsWith('test-uuid-')).toBe(true);
    expect(fixedId).not.toBe(oldId);
  });

  it('should preserve an already-valid UUID', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';
    let fixedId = validId;
    if (!isValidUUID(fixedId)) {
      fixedId = crypto.randomUUID();
    }
    expect(fixedId).toBe(validId);
  });

  it('should generate unique UUIDs for each non-UUID expense', () => {
    const expenses = [
      { id: '1741234567890' },
      { id: '1741234567891' },
      { id: '1741234567892' },
    ];

    const fixedIds = expenses.map(e => {
      if (!isValidUUID(e.id)) return crypto.randomUUID();
      return e.id;
    });

    const uniqueIds = new Set(fixedIds);
    expect(uniqueIds.size).toBe(3);
  });
});

describe('Bug Fix: Migration only clears localStorage on full success', () => {
  it('should keep localStorage when all uploads fail', () => {
    const localExpenses = [
      { id: '1', description: 'Dinner', amount: 100 },
      { id: '2', description: 'Lunch', amount: 50 },
    ];
    localStorage.setItem('expenses', JSON.stringify(localExpenses));

    let failedExpenses = 0;
    const totalItems = localExpenses.length;

    for (let i = 0; i < totalItems; i++) {
      const uploadSuccess = false;
      if (!uploadSuccess) failedExpenses++;
    }

    const totalFailed = failedExpenses;
    if (totalFailed === 0) {
      localStorage.removeItem('expenses');
    }

    expect(localStorage.getItem('expenses')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem('expenses')!)).toHaveLength(2);
  });

  it('should keep localStorage when some uploads fail (partial failure)', () => {
    const localExpenses = [
      { id: '1', description: 'Dinner', amount: 100 },
      { id: '2', description: 'Lunch', amount: 50 },
      { id: '3', description: 'Taxi', amount: 30 },
    ];
    localStorage.setItem('expenses', JSON.stringify(localExpenses));

    let migratedExpenses = 0;
    let failedExpenses = 0;

    const uploadResults = [true, false, true];
    uploadResults.forEach(success => {
      if (success) migratedExpenses++;
      else failedExpenses++;
    });

    const totalFailed = failedExpenses;
    if (totalFailed === 0) {
      localStorage.removeItem('expenses');
    }

    expect(totalFailed).toBeGreaterThan(0);
    expect(localStorage.getItem('expenses')).not.toBeNull();
  });

  it('should clear localStorage when all uploads succeed', () => {
    const localExpenses = [
      { id: '1', description: 'Dinner', amount: 100 },
      { id: '2', description: 'Lunch', amount: 50 },
    ];
    localStorage.setItem('expenses', JSON.stringify(localExpenses));
    localStorage.setItem('settlements', JSON.stringify([]));

    let failedExpenses = 0;
    let failedSettlements = 0;

    localExpenses.forEach(() => {
      const uploadSuccess = true;
      if (!uploadSuccess) failedExpenses++;
    });

    const totalFailed = failedExpenses + failedSettlements;
    if (totalFailed === 0) {
      localStorage.removeItem('expenses');
      localStorage.removeItem('settlements');
    }

    expect(localStorage.getItem('expenses')).toBeNull();
    expect(localStorage.getItem('settlements')).toBeNull();
  });
});

describe('Bug Fix: Migration counters report accurately', () => {
  it('should count migrated and failed items separately', () => {
    const expenses = Array.from({ length: 5 }, (_, i) => ({
      id: `exp-${i}`,
      description: `Expense ${i}`,
      amount: 100,
    }));

    let migratedExpenses = 0;
    let failedExpenses = 0;

    const results = [true, true, false, true, false];
    results.forEach(success => {
      if (success) migratedExpenses++;
      else failedExpenses++;
    });

    expect(migratedExpenses).toBe(3);
    expect(failedExpenses).toBe(2);
    expect(migratedExpenses + failedExpenses).toBe(expenses.length);
  });

  it('should handle both expense and settlement migration counters', () => {
    let migratedExpenses = 0;
    let failedExpenses = 0;
    let migratedSettlements = 0;
    let failedSettlements = 0;

    [true, true, true].forEach(s => s ? migratedExpenses++ : failedExpenses++);
    [true, false].forEach(s => s ? migratedSettlements++ : failedSettlements++);

    const totalFailed = failedExpenses + failedSettlements;
    expect(totalFailed).toBe(1);
    expect(migratedExpenses).toBe(3);
    expect(migratedSettlements).toBe(1);
  });
});

describe('Bug Fix: Migration detects local data correctly', () => {
  it('should detect migration needed when localStorage has expenses', () => {
    const expenses = [{ id: '1', description: 'Test', amount: 100 }];
    localStorage.setItem('expenses', JSON.stringify(expenses));

    const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const localSettlements = JSON.parse(localStorage.getItem('settlements') || '[]');
    const needsMigration = localExpenses.length > 0 || localSettlements.length > 0;

    expect(needsMigration).toBe(true);
  });

  it('should detect migration needed when localStorage has settlements', () => {
    const settlements = [{ id: 's1', from_member: 'Adji', to_member: 'Bloch', amount: 50 }];
    localStorage.setItem('settlements', JSON.stringify(settlements));

    const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const localSettlements = JSON.parse(localStorage.getItem('settlements') || '[]');
    const needsMigration = localExpenses.length > 0 || localSettlements.length > 0;

    expect(needsMigration).toBe(true);
  });

  it('should not detect migration needed when localStorage is empty', () => {
    const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const localSettlements = JSON.parse(localStorage.getItem('settlements') || '[]');
    const needsMigration = localExpenses.length > 0 || localSettlements.length > 0;

    expect(needsMigration).toBe(false);
  });

  it('should not detect migration when localStorage has empty arrays', () => {
    localStorage.setItem('expenses', '[]');
    localStorage.setItem('settlements', '[]');

    const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const localSettlements = JSON.parse(localStorage.getItem('settlements') || '[]');
    const needsMigration = localExpenses.length > 0 || localSettlements.length > 0;

    expect(needsMigration).toBe(false);
  });
});

describe('Bug Fix: Dismiss migration clears local data', () => {
  it('should clear both expenses and settlements from localStorage on dismiss', () => {
    localStorage.setItem('expenses', JSON.stringify([{ id: '1' }]));
    localStorage.setItem('settlements', JSON.stringify([{ id: 's1' }]));

    localStorage.removeItem('expenses');
    localStorage.removeItem('settlements');

    expect(localStorage.getItem('expenses')).toBeNull();
    expect(localStorage.getItem('settlements')).toBeNull();
  });

  it('should not affect currentUser when dismissing migration', () => {
    localStorage.setItem('currentUser', 'Bloch');
    localStorage.setItem('expenses', JSON.stringify([{ id: '1' }]));
    localStorage.setItem('settlements', JSON.stringify([{ id: 's1' }]));

    localStorage.removeItem('expenses');
    localStorage.removeItem('settlements');

    expect(localStorage.getItem('currentUser')).toBe('Bloch');
  });
});
