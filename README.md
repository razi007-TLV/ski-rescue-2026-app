# ⛷️ Ski Rescue 2026 - Expense Tracker

A modern, beautiful expense tracking and splitting application built for the Ski Rescue 2026 trip. Track expenses, manage settlements, and automatically calculate who owes whom.

## Features

- 💰 **Expense Tracking**: Add and manage expenses with multiple currency support (NIS, USD, EUR)
- 🔄 **Automatic Currency Conversion**: All amounts converted to NIS for easy comparison
- 👥 **Member Management**: Track expenses for Bloch, Adji, and Razi
- 📊 **Balance Calculation**: Real-time balance updates showing who paid what and who owes what
- 🎯 **Smart Debt Simplification**: Minimizes the number of transactions needed to settle up
- 💳 **Settlement Tracking**: Record payments between members
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- 🌙 **Dark Mode Support**: Automatic dark mode based on system preferences
- 💾 **Local Storage**: Data persists in browser localStorage

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Ski-Rescue-2026-APP
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding an Expense

1. Go to the "Expenses" tab
2. Fill in the expense details:
   - Description (e.g., "Ski lift tickets")
   - Category (Food, Transportation, etc.)
   - Amount and currency
   - Who paid
   - Split type (equal or custom)
3. Click "Add Expense"

### Recording a Settlement

1. Go to the "Settlements" tab
2. Select who paid whom
3. Enter the amount and currency
4. Add an optional note
5. Click "Record Settlement"

### Viewing Balances

1. Go to the "Summary" tab
2. See current balances for each member
3. View settlement suggestions to minimize transactions

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ExpenseForm.tsx
│   ├── ExpenseList.tsx
│   ├── BalancesSummary.tsx
│   ├── SettlementForm.tsx
│   ├── SettlementList.tsx
│   └── SettlementSuggestions.tsx
├── lib/                   # Utility functions
│   └── utils.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
├── config/                # Configuration
│   └── index.ts
└── __tests__/            # Test files
    └── utils.test.ts
```

## Exchange Rates

Current exchange rates (configurable in `config/index.ts`):
- USD: 3.65 NIS
- EUR: 3.95 NIS
- NIS: 1.00 NIS

## Building for Production

```bash
npm run build
npm start
```

## License

Private project for Ski Rescue 2026 trip.

## Contributors

- Bloch
- Adji
- Razi
