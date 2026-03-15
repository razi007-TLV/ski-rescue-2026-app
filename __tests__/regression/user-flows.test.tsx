import { render, screen, fireEvent, within } from '@testing-library/react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BalancesSummary from '@/components/BalancesSummary';
import SettlementForm from '@/components/SettlementForm';
import SettlementList from '@/components/SettlementList';
import SettlementSuggestions from '@/components/SettlementSuggestions';
import { Expense, Settlement, Balance, SimplifiedDebt, Member } from '@/types';
import { MEMBERS } from '@/config';

beforeEach(() => {
  localStorage.clear();
  (window.confirm as jest.Mock).mockReturnValue(true);
  (window.alert as jest.Mock).mockClear();
});

describe('User Flow: Adding Expenses', () => {
  it('should successfully add a valid expense', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    fireEvent.change(screen.getByPlaceholderText('e.g., Ski lift tickets'), {
      target: { value: 'Dinner at restaurant' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '200' },
    });
    fireEvent.click(screen.getByText('Add Expense'));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Dinner at restaurant',
        amount: 200,
        currency: 'EUR',
        paid_by: 'Bloch',
      })
    );
  });

  it('should reject submission with empty description', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByText('Add Expense'));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should reject submission with zero amount', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    fireEvent.change(screen.getByPlaceholderText('e.g., Ski lift tickets'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByText('Add Expense'));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should reject submission with negative amount', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    fireEvent.change(screen.getByPlaceholderText('e.g., Ski lift tickets'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '-50' },
    });
    fireEvent.click(screen.getByText('Add Expense'));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should clear form after successful submission', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    const descInput = screen.getByPlaceholderText('e.g., Ski lift tickets') as HTMLInputElement;
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;

    fireEvent.change(descInput, { target: { value: 'Dinner' } });
    fireEvent.change(amountInput, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Add Expense'));

    expect(descInput.value).toBe('');
    expect(amountInput.value).toBe('');
  });

  it('should default paidBy to the current user', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Razi" />);

    const paidByInput = screen.getByDisplayValue('Razi');
    expect(paidByInput).toBeInTheDocument();
    expect(paidByInput).toHaveAttribute('readOnly');
  });

  it('should support all currency options', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    const currencySelect = screen.getAllByRole('combobox')[1];
    const options = within(currencySelect).getAllByRole('option');
    const values = options.map(o => (o as HTMLOptionElement).value);
    expect(values).toContain('NIS');
    expect(values).toContain('USD');
    expect(values).toContain('EUR');
  });
});

describe('User Flow: Custom Split', () => {
  it('should allow switching to custom split mode', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    const splitSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(splitSelect, { target: { value: 'custom' } });

    expect(screen.getByText('Select Members to Split Between')).toBeInTheDocument();
  });

  it('should reject custom split where total does not match amount', () => {
    const onAdd = jest.fn();
    render(<ExpenseForm onAddExpense={onAdd} defaultPaidBy="Bloch" />);

    fireEvent.change(screen.getByPlaceholderText('e.g., Ski lift tickets'), {
      target: { value: 'Custom dinner' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });

    const splitSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(splitSelect, { target: { value: 'custom' } });

    const splitInputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(splitInputs[1], { target: { value: '10' } });
    fireEvent.change(splitInputs[2], { target: { value: '10' } });
    fireEvent.change(splitInputs[3], { target: { value: '10' } });
    fireEvent.change(splitInputs[4], { target: { value: '10' } });

    fireEvent.click(screen.getByText('Add Expense'));

    expect(window.alert).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('User Flow: Expense List', () => {
  const expenses: Expense[] = [
    {
      id: '1', date: '2026-03-10T10:00:00.000Z', description: 'Dinner',
      amount: 300, currency: 'NIS', paid_by: 'Bloch',
      splits: { Bloch: 75, Adji: 75, Razi: 75, Kalish: 75 },
      category: 'Food & Dining',
    },
    {
      id: '2', date: '2026-03-11T10:00:00.000Z', description: 'Taxi',
      amount: 50, currency: 'USD', paid_by: 'Adji',
      splits: { Bloch: 12.5, Adji: 12.5, Razi: 12.5, Kalish: 12.5 },
      category: 'Transportation',
    },
  ];

  it('should display all expenses', () => {
    const onDelete = jest.fn();
    render(<ExpenseList expenses={expenses} onDeleteExpense={onDelete} />);

    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();
  });

  it('should display expense amounts correctly', () => {
    const onDelete = jest.fn();
    render(<ExpenseList expenses={expenses} onDeleteExpense={onDelete} />);

    expect(screen.getByText('₪300.00')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('should display NIS equivalent for foreign currency expenses', () => {
    const onDelete = jest.fn();
    render(<ExpenseList expenses={expenses} onDeleteExpense={onDelete} />);

    expect(screen.getByText('(₪154.00)')).toBeInTheDocument();
  });

  it('should call delete handler with correct ID', () => {
    const onDelete = jest.fn();
    render(<ExpenseList expenses={[expenses[0]]} onDeleteExpense={onDelete} />);

    fireEvent.click(screen.getByLabelText('Delete expense'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('should show empty state with no expenses', () => {
    const onDelete = jest.fn();
    render(<ExpenseList expenses={[]} onDeleteExpense={onDelete} />);

    expect(screen.getByText('No expenses yet. Add your first expense above!')).toBeInTheDocument();
  });

  it('should sort expenses by date (newest first)', () => {
    const onDelete = jest.fn();
    render(<ExpenseList expenses={expenses} onDeleteExpense={onDelete} />);

    const headers = screen.getAllByRole('heading', { level: 4 });
    expect(headers[0]).toHaveTextContent('Taxi');
    expect(headers[1]).toHaveTextContent('Dinner');
  });

  it('should display category for each expense', () => {
    const onDelete = jest.fn();
    render(<ExpenseList expenses={expenses} onDeleteExpense={onDelete} />);

    expect(screen.getByText(/Food & Dining/)).toBeInTheDocument();
    expect(screen.getByText(/Transportation/)).toBeInTheDocument();
  });
});

describe('User Flow: Settlement Form', () => {
  it('should add a valid settlement', () => {
    const onAdd = jest.fn();
    render(<SettlementForm onAddSettlement={onAdd} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Adji' } });
    fireEvent.change(selects[1], { target: { value: 'Bloch' } });

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record Settlement' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        from_member: 'Adji',
        to_member: 'Bloch',
        amount: 100,
      })
    );
  });

  it('should show warning when from equals to', () => {
    const onAdd = jest.fn();
    render(<SettlementForm onAddSettlement={onAdd} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Bloch' } });
    fireEvent.change(selects[1], { target: { value: 'Bloch' } });

    expect(screen.getByText('From and To members must be different.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record Settlement' })).toBeDisabled();
  });

  it('should clear amount and note after submission', () => {
    const onAdd = jest.fn();
    render(<SettlementForm onAddSettlement={onAdd} />);

    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    const noteInput = screen.getByPlaceholderText('e.g., Cash payment') as HTMLInputElement;

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Adji' } });
    fireEvent.change(selects[1], { target: { value: 'Bloch' } });
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(noteInput, { target: { value: 'Test note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Settlement' }));

    expect(amountInput.value).toBe('');
    expect(noteInput.value).toBe('');
  });
});

describe('User Flow: Settlement List', () => {
  const settlements: Settlement[] = [
    {
      id: 's1', date: '2026-03-10T10:00:00.000Z',
      from_member: 'Adji', to_member: 'Bloch',
      amount: 100, currency: 'NIS', note: 'Cash payment',
    },
    {
      id: 's2', date: '2026-03-11T10:00:00.000Z',
      from_member: 'Razi', to_member: 'Bloch',
      amount: 50, currency: 'USD',
    },
  ];

  it('should display all settlements', () => {
    const onDelete = jest.fn();
    render(<SettlementList settlements={settlements} onDeleteSettlement={onDelete} />);

    expect(screen.getByText('Adji')).toBeInTheDocument();
    expect(screen.getByText('Razi')).toBeInTheDocument();
  });

  it('should display settlement notes', () => {
    const onDelete = jest.fn();
    render(<SettlementList settlements={settlements} onDeleteSettlement={onDelete} />);

    expect(screen.getByText('Cash payment')).toBeInTheDocument();
  });

  it('should show NIS equivalent for foreign currency settlements', () => {
    const onDelete = jest.fn();
    render(<SettlementList settlements={settlements} onDeleteSettlement={onDelete} />);

    expect(screen.getByText('₪154.00')).toBeInTheDocument();
  });

  it('should call delete handler with correct ID', () => {
    const onDelete = jest.fn();
    render(<SettlementList settlements={[settlements[0]]} onDeleteSettlement={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('s1');
  });

  it('should show empty state', () => {
    const onDelete = jest.fn();
    render(<SettlementList settlements={[]} onDeleteSettlement={onDelete} />);

    expect(screen.getByText('No settlements recorded yet.')).toBeInTheDocument();
  });
});

describe('User Flow: Balances Summary', () => {
  const balances: Balance[] = [
    { member: 'Bloch', paid: 400, owes: 100, net: 300 },
    { member: 'Adji', paid: 0, owes: 100, net: -100 },
    { member: 'Razi', paid: 0, owes: 100, net: -100 },
    { member: 'Kalish', paid: 0, owes: 0, net: 0 },
  ];

  it('should display all 4 members', () => {
    render(<BalancesSummary balances={balances} />);
    MEMBERS.forEach(member => {
      expect(screen.getByText(member)).toBeInTheDocument();
    });
  });

  it('should show positive balance in green', () => {
    render(<BalancesSummary balances={balances} />);
    const positive = screen.getByText('+₪300.00');
    expect(positive).toHaveClass('text-green-600');
  });

  it('should show negative balance in red', () => {
    render(<BalancesSummary balances={balances} />);
    const negatives = screen.getAllByText('₪-100.00');
    negatives.forEach(el => {
      expect(el).toHaveClass('text-red-600');
    });
  });

  it('should show zero balance in gray', () => {
    render(<BalancesSummary balances={balances} />);
    const zero = screen.getByText('₪0.00', { selector: '.font-bold' });
    expect(zero).toHaveClass('text-gray-600');
  });

  it('should display paid and owes amounts', () => {
    render(<BalancesSummary balances={balances} />);
    expect(screen.getByText('₪400.00')).toBeInTheDocument();
  });
});

describe('User Flow: Settlement Suggestions', () => {
  it('should display suggestions when debts exist', () => {
    const debts: SimplifiedDebt[] = [
      { from: 'Adji', to: 'Bloch', amount: 100 },
    ];
    render(<SettlementSuggestions debts={debts} currentUser="Bloch" />);
    expect(screen.getByText('Your settlements')).toBeInTheDocument();
    expect(screen.getByText('Adji', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('pays')).toBeInTheDocument();
  });

  it('should show all-settled message when no debts', () => {
    render(<SettlementSuggestions debts={[]} currentUser="Bloch" />);
    expect(screen.getByText(/All settled up/)).toBeInTheDocument();
  });

  it('should display correct amount for each suggestion', () => {
    const debts: SimplifiedDebt[] = [
      { from: 'Adji', to: 'Bloch', amount: 150 },
      { from: 'Razi', to: 'Bloch', amount: 75 },
    ];
    render(<SettlementSuggestions debts={debts} currentUser="Bloch" />);
    expect(screen.getByText('₪150.00')).toBeInTheDocument();
    expect(screen.getByText('₪75.00')).toBeInTheDocument();
  });
});
