export const formatCurrency = (amount) => {
  return `₹${Math.abs(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

export const calculateTotal = (expenses, type = 'all') => {
  // Add safety check for undefined or null expenses
  if (!expenses || !Array.isArray(expenses)) {
    return 0;
  }
  
  return expenses
    .filter(expense => type === 'all' || expense.type === type)
    .reduce((sum, expense) => sum + expense.amount, 0);
};

export const calculateCategoryTotals = (expenses) => {
  // Add safety check for undefined or null expenses
  if (!expenses || !Array.isArray(expenses)) {
    return {};
  }
  
  const categoryTotals = {};
  
  expenses.forEach(expense => {
    if (expense.type === 'expense') {
      if (!categoryTotals[expense.categoryId]) {
        categoryTotals[expense.categoryId] = 0;
      }
      categoryTotals[expense.categoryId] += expense.amount;
    }
  });
  
  return categoryTotals;
};

export const calculateDailyAverage = (expenses, days = 30) => {
  const expenseTotal = calculateTotal(expenses, 'expense');
  return expenseTotal / days;
};

export const getTopCategories = (expenses, limit = 5) => {
  // Add safety check for undefined or null expenses
  if (!expenses || !Array.isArray(expenses)) {
    return [];
  }
  
  const categoryTotals = calculateCategoryTotals(expenses);
  
  return Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
    }));
};

export const calculateBudgetProgress = (spent, budget) => {
  if (budget === 0) return 0;
  return Math.min((spent / budget) * 100, 100);
};

export const groupExpensesByDate = (expenses) => {
  // Add safety check for undefined or null expenses
  if (!expenses || !Array.isArray(expenses)) {
    return [];
  }
  
  const grouped = {};
  
  expenses.forEach(expense => {
    const date = new Date(expense.date).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(expense);
  });
  
  return Object.entries(grouped)
    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
    .map(([date, items]) => ({
      date,
      timestamp: new Date(date).getTime(),
      data: items.sort((a, b) => b.date - a.date),
    }));
};