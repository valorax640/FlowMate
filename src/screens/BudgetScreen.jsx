import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDateContext } from '../context/DateContext';
import CommonHeader from '../components/CommonHeader';
import BudgetProgress from '../components/BudgetProgress';
import { APP_COLORS, DEFAULT_CATEGORIES } from '../constants/expenseCategories';
import {
  loadExpenses,
  loadBudgets,
  saveBudgets,
  loadCategories,
} from '../utils/expenseStorage';
import { calculateCategoryTotals, formatCurrency } from '../utils/calculations';
import { getFormattedMonthYear } from '../utils/dateHelpers';

const BudgetScreen = () => {
  const { selectedMonth, selectedYear } = useDateContext();
  const [budgets, setBudgets] = useState({});
  const [categoryTotals, setCategoryTotals] = useState({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [editingCategory, setEditingCategory] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedMonth, selectedYear]),
  );

  // Reload data when selected month or year changes
  React.useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      const expenses = await loadExpenses();
      const loadedBudgets = await loadBudgets(selectedMonth, selectedYear);
      const loadedCategories = await loadCategories();

      // Ensure expenses is always an array
      const expensesArray = Array.isArray(expenses) ? expenses : [];
      const selectedMonthExpenses = expensesArray.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === selectedMonth &&
          expenseDate.getFullYear() === selectedYear &&
          e.type === 'expense';
      });
      const totals = calculateCategoryTotals(selectedMonthExpenses);

      setCategoryTotals(totals);
      setBudgets(loadedBudgets || {});
      if (loadedCategories && Array.isArray(loadedCategories)) {
        setCategories(loadedCategories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setCategoryTotals({});
      setBudgets({});
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSetBudget = (categoryId) => {
    setEditingCategory(categoryId);
    setBudgetInput(budgets[categoryId]?.toString() || '');
  };

  const handleSaveBudget = async () => {
    if (!budgetInput || parseFloat(budgetInput) <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget amount.');
      return;
    }

    const newBudgets = {
      ...budgets,
      [editingCategory]: parseFloat(budgetInput),
    };

    setBudgets(newBudgets);
    await saveBudgets(newBudgets, selectedMonth, selectedYear);
    setEditingCategory(null);
    setBudgetInput('');
  };

  const handleRemoveBudget = async (categoryId) => {
    Alert.alert(
      'Remove Budget',
      'Are you sure you want to remove this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const newBudgets = { ...budgets };
            delete newBudgets[categoryId];
            setBudgets(newBudgets);
            await saveBudgets(newBudgets, selectedMonth, selectedYear);
          },
        },
      ],
    );
  };

  const totalBudget = Object.values(budgets).reduce((sum, b) => sum + b, 0);
  const totalSpent = Object.values(categoryTotals).reduce((sum, t) => sum + t, 0);

  const categoriesWithBudgets = categories.filter(cat => budgets[cat.id]);
  const categoriesWithoutBudgets = categories.filter(cat => !budgets[cat.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CommonHeader title="Budget" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={APP_COLORS.primary}
            colors={[APP_COLORS.primary]}
          />
        }>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.monthText}>{getFormattedMonthYear(selectedMonth, selectedYear)}</Text>
            <Icon name="calendar" size={20} color={APP_COLORS.primary} />
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Budget</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalBudget)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryValue, styles.expenseValue]}>
                {formatCurrency(totalSpent)}
              </Text>
            </View>
          </View>

          {totalBudget > 0 && (
            <View style={styles.totalProgress}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                      backgroundColor:
                        totalSpent > totalBudget
                          ? APP_COLORS.danger
                          : totalSpent / totalBudget > 0.8
                            ? APP_COLORS.warning
                            : APP_COLORS.success,
                    },
                  ]}
                />
              </View>
              <Text style={styles.remainingText}>
                {formatCurrency(Math.abs(totalBudget - totalSpent))}{' '}
                {totalSpent > totalBudget ? 'over budget' : 'remaining'}
              </Text>
            </View>
          )}
        </View>

        {/* Budgets with Progress */}
        {categoriesWithBudgets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Tracking</Text>
            {categoriesWithBudgets.map(category => (
              <BudgetProgress
                key={category.id}
                category={category}
                spent={categoryTotals[category.id] || 0}
                budget={budgets[category.id]}
                onPress={() => handleRemoveBudget(category.id)}
              />
            ))}
          </View>
        )}

        {/* Categories without Budgets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Budget</Text>
          {categoriesWithoutBudgets.map(category => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => handleSetBudget(category.id)}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: category.color + '20' },
                ]}>
                <Icon name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Icon name="add-circle" size={24} color={APP_COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Budget Input Modal */}
      {editingCategory && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Monthly Budget</Text>
            <Text style={styles.modalSubtitle}>
              {categories.find(c => c.id === editingCategory)?.name}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputCurrency}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={APP_COLORS.textLight}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditingCategory(null);
                  setBudgetInput('');
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveBudget}>
                <Text style={styles.saveButtonText}>Set Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: APP_COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  expenseValue: {
    color: APP_COLORS.expense,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: APP_COLORS.border,
    marginHorizontal: 16,
  },
  totalProgress: {
    marginTop: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: APP_COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: APP_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: APP_COLORS.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  inputCurrency: {
    fontSize: 32,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    marginRight: 8,
  },
  input: {
    fontSize: 40,
    fontWeight: '700',
    color: APP_COLORS.text,
    minWidth: 150,
    textAlign: 'left',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: APP_COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: APP_COLORS.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default BudgetScreen;