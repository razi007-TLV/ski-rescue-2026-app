# 🚀 Quick Start Guide

## Get Started in 3 Steps

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Start Development Server
```bash
npm run dev
```

### 3️⃣ Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📱 Using the App

### Adding Your First Expense
1. Click the **"Expenses"** tab
2. Fill in the details:
   - Description: "Ski lift tickets"
   - Amount: 300
   - Currency: NIS
   - Paid by: Select who paid
   - Split: Choose equal or custom
3. Click **"Add Expense"**

### Viewing Balances
1. Click the **"Summary"** tab
2. See who owes what
3. View settlement suggestions

### Recording a Settlement
1. Click the **"Settlements"** tab
2. Select who paid whom
3. Enter the amount
4. Click **"Record Settlement"**

---

## 🧪 Running Tests
```bash
npm test
```

## 🏗️ Building for Production
```bash
npm run build
npm start
```

---

## 💡 Tips

- **Data Persistence**: Your data is saved in browser localStorage
- **Currency Conversion**: All amounts are automatically converted to NIS
- **Smart Suggestions**: The app calculates the minimum number of payments needed
- **Dark Mode**: Automatically follows your system preferences

---

## 🎯 Example Scenario

**Scenario**: Bloch paid ₪400 for dinner, split equally

1. Add expense:
   - Description: "Dinner at restaurant"
   - Amount: 400
   - Currency: NIS
   - Paid by: Bloch
   - Split: Equal

2. Result:
   - Bloch: +₪300 (paid ₪400, owes ₪100)
   - Adji: -₪100 (owes ₪100)
   - Razi: -₪100 (owes ₪100)
   - Kalish: -₪100 (owes ₪100)

3. Settlement suggestions:
   - Adji should pay Bloch ₪100
   - Razi should pay Bloch ₪100
   - Kalish should pay Bloch ₪100

---

**Happy tracking! ⛷️**
