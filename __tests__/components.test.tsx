import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BalancesSummary from '@/components/BalancesSummary';
import SettlementSuggestions from '@/components/SettlementSuggestions';
import { Expense, Balance, SimplifiedDebt } from '@/types';

describe('ExpenseForm', () => {
  it('should render the form', () => {
    const mockOnAddExpense = jest.fn();
    render(<ExpenseForm onAddExpense={mockOnAddExpense} />);
    
    expect(screen.getByText('Add New Expense')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Ski lift tickets')).toBeInTheDocument();
  });

  it('should call onAddExpense when form is submitted', () => {
    const mockOnAddExpense = jest.fn();
    render(<ExpenseForm onAddExpense={mockOnAddExpense} />);
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Ski lift tickets'), {
      target: { value: 'Test Expense' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });
    
    fireEvent.click(screen.getByText('Add Expense'));
    
    expect(mockOnAddExpense).toHaveBeenCalledTimes(1);
    expect(mockOnAddExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Test Expense',
        amount: 100,
      })
    );
  });
});

describe('ExpenseList', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      date: '2026-03-10T00:00:00.000Z',
      description: 'Dinner',
      amount: 300,
      currency: 'NIS',
      paid_by: 'Bloch',
      splits: { Bloch: 100, Adji: 100, Razi: 100 },
      category: 'Food & Dining',
    },
  ];

  it('should render expenses', () => {
    const mockOnDelete = jest.fn();
    render(<ExpenseList expenses={mockExpenses} onDeleteExpense={mockOnDelete} />);
    
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('₪300.00')).toBeInTheDocument();
  });

  it('should show empty state when no expenses', () => {
    const mockOnDelete = jest.fn();
    render(<ExpenseList expenses={[]} onDeleteExpense={mockOnDelete} />);
    
    expect(screen.getByText('No expenses yet. Add your first expense above!')).toBeInTheDocument();
  });

  it('should call onDeleteExpense when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    render(<ExpenseList expenses={mockExpenses} onDeleteExpense={mockOnDelete} />);
    
    const deleteButton = screen.getByLabelText('Delete expense');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});

describe('BalancesSummary', () => {
  const mockBalances: Balance[] = [
    { member: 'Bloch', paid: 300, owes: 100, net: 200 },
    { member: 'Adji', paid: 0, owes: 100, net: -100 },
    { member: 'Razi', paid: 0, owes: 100, net: -100 },
  ];

  it('should render balances for all members', () => {
    render(<BalancesSummary balances={mockBalances} />);
    
    expect(screen.getByText('Bloch')).toBeInTheDocument();
    expect(screen.getByText('Adji')).toBeInTheDocument();
    expect(screen.getByText('Razi')).toBeInTheDocument();
  });

  it('should display positive net balance in green', () => {
    render(<BalancesSummary balances={mockBalances} />);
    
    const blochNet = screen.getByText('+₪200.00');
    expect(blochNet).toHaveClass('text-green-600');
  });

  it('should display negative net balance in red', () => {
    render(<BalancesSummary balances={mockBalances} />);
    
    const adjiNets = screen.getAllByText('-₪100.00');
    adjiNets.forEach(net => {
      expect(net).toHaveClass('text-red-600');
    });
  });
});

describe('SettlementSuggestions', () => {
  const mockDebts: SimplifiedDebt[] = [
    { from: 'Adji', to: 'Bloch', amount: 100 },
    { from: 'Razi', to: 'Bloch', amount: 100 },
  ];

  it('should render settlement suggestions', () => {
    render(<SettlementSuggestions debts={mockDebts} />);
    
    expect(screen.getByText(/Adji.*should pay.*Bloch/)).toBeInTheDocument();
    expect(screen.getByText(/Razi.*should pay.*Bloch/)).toBeInTheDocument();
  });

  it('should show settled message when no debts', () => {
    render(<SettlementSuggestions debts={[]} />);
    
    expect(screen.getByText(/All settled up! No outstanding debts/)).toBeInTheDocument();
  });
});
