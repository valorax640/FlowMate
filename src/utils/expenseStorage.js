import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENSES_KEY = '@expense_tracker_expenses';
const BUDGETS_KEY = '@expense_tracker_budgets';
const CATEGORIES_KEY = '@expense_tracker_categories';

// Expenses
export const saveExpenses = async (expenses) => {
  try {
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    return true;
  } catch (error) {
    console.error('Error saving expenses:', error);
    return false;
  }
};

export const loadExpenses = async () => {
  try {
    const expensesJson = await AsyncStorage.getItem(EXPENSES_KEY);
    return expensesJson ? JSON.parse(expensesJson) : [];
  } catch (error) {
    console.error('Error loading expenses:', error);
    return [];
  }
};

// Budgets - Now supports month/year specific budgets
export const saveBudgets = async (budgets, month, year) => {
  try {
    // If month and year are provided, save for specific period
    if (month !== undefined && year !== undefined) {
      const allBudgets = await loadAllBudgets();
      const key = `${year}-${month}`;
      allBudgets[key] = budgets;
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(allBudgets));
    } else {
      // Legacy support - save globally
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    }
    return true;
  } catch (error) {
    console.error('Error saving budgets:', error);
    return false;
  }
};

export const loadBudgets = async (month, year) => {
  try {
    const budgetsJson = await AsyncStorage.getItem(BUDGETS_KEY);
    if (!budgetsJson) return {};
    
    const allBudgets = JSON.parse(budgetsJson);
    
    // If month and year are provided, load for specific period
    if (month !== undefined && year !== undefined) {
      const key = `${year}-${month}`;
      return allBudgets[key] || {};
    }
    
    // Legacy support - if the stored data is not in new format, return as is
    if (!allBudgets || typeof allBudgets !== 'object') return {};
    
    // Check if it's old format (direct category budgets)
    const firstKey = Object.keys(allBudgets)[0];
    if (firstKey && !firstKey.includes('-')) {
      // Old format, return as is
      return allBudgets;
    }
    
    return {};
  } catch (error) {
    console.error('Error loading budgets:', error);
    return {};
  }
};

export const loadAllBudgets = async () => {
  try {
    const budgetsJson = await AsyncStorage.getItem(BUDGETS_KEY);
    return budgetsJson ? JSON.parse(budgetsJson) : {};
  } catch (error) {
    console.error('Error loading all budgets:', error);
    return {};
  }
};

// Categories
export const saveCategories = async (categories) => {
  try {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    return true;
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }
};

export const loadCategories = async () => {
  try {
    const categoriesJson = await AsyncStorage.getItem(CATEGORIES_KEY);
    return categoriesJson ? JSON.parse(categoriesJson) : null;
  } catch (error) {
    console.error('Error loading categories:', error);
    return null;
  }
};

export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([EXPENSES_KEY, BUDGETS_KEY, CATEGORIES_KEY]);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};