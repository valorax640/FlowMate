import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {PieChart} from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Ionicons';
import CommonHeader from '../components/CommonHeader';
import {useDateContext} from '../context/DateContext';
import {APP_COLORS, DEFAULT_CATEGORIES, INCOME_CATEGORIES} from '../constants/expenseCategories';
import {loadExpenses, loadCategories} from '../utils/expenseStorage';
import {
  calculateTotal,
  calculateCategoryTotals,
  formatCurrency,
  getTopCategories,
} from '../utils/calculations';
import {isThisMonth} from '../utils/dateHelpers';

const {width} = Dimensions.get('window');
const chartWidth = width - 32;

const StatisticsScreen = () => {
  const {selectedMonth, selectedYear} = useDateContext();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([...DEFAULT_CATEGORIES, ...INCOME_CATEGORIES]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      const loadedExpenses = await loadExpenses();
      const loadedCategories = await loadCategories();
      
      // Ensure expenses is always an array
      setExpenses(Array.isArray(loadedExpenses) ? loadedExpenses : []);
      if (loadedCategories && Array.isArray(loadedCategories)) {
        setCategories(loadedCategories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setExpenses([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id) || categories[categories.length - 1];
  };

  const filterExpensesByPeriod = () => {
    const now = new Date();
    
    if (selectedPeriod === 'month') {
      return expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === selectedMonth && 
               expenseDate.getFullYear() === selectedYear;
      });
    } else if (selectedPeriod === 'year') {
      return expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getFullYear() === selectedYear;
      });
    }
    
    return expenses;
  };

  const filteredExpenses = filterExpensesByPeriod();
  const expenseOnly = filteredExpenses.filter(e => e.type === 'expense');
  const income = calculateTotal(filteredExpenses, 'income');
  const expenseTotal = calculateTotal(filteredExpenses, 'expense');
  const categoryTotals = calculateCategoryTotals(expenseOnly);
  const topCategories = getTopCategories(expenseOnly, 5);

  // Prepare Pie Chart Data
  const pieChartData = topCategories.map(({categoryId, amount}) => {
    const category = getCategoryById(categoryId);
    return {
      name: category.name.length > 10 ? category.name.substring(0, 10) + '...' : category.name,
      population: amount,
      color: category.color,
      legendFontColor: APP_COLORS.text,
      legendFontSize: 11,
      categoryId: categoryId,
      fullName: category.name,
      amount: amount,
    };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CommonHeader title="Statistics" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={APP_COLORS.primary}
            colors={[APP_COLORS.primary]}
          />
        }>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('month')}>
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'month' && styles.periodTextActive,
              ]}>
              Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'year' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('year')}>
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'year' && styles.periodTextActive,
              ]}>
              Year
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'all' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('all')}>
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'all' && styles.periodTextActive,
              ]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, {backgroundColor: '#E8F5E9'}]}>
            <Icon name="arrow-down-circle" size={28} color={APP_COLORS.income} />
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, {color: APP_COLORS.income}]}>
              {formatCurrency(income)}
            </Text>
          </View>

          <View style={[styles.summaryCard, {backgroundColor: '#FFEBEE'}]}>
            <Icon name="arrow-up-circle" size={28} color={APP_COLORS.expense} />
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, {color: APP_COLORS.expense}]}>
              {formatCurrency(expenseTotal)}
            </Text>
          </View>
        </View>

        {/* Pie Chart - Category Breakdown */}
        {pieChartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Spending by Category</Text>
            <View style={styles.pieChartWrapper}>
              <PieChart
                data={pieChartData}
                width={chartWidth - 32}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="20"
                hasLegend={false}
                absolute
              />
            </View>
            
            {/* Custom Legend */}
            <View style={styles.legendContainer}>
              {pieChartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, {backgroundColor: item.color}]} />
                  <View style={styles.legendTextContainer}>
                    <Text style={styles.legendName}>{item.fullName}</Text>
                    <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Icon name="pie-chart-outline" size={60} color={APP_COLORS.textLight} />
            <Text style={styles.emptyText}>No expense data available</Text>
          </View>
        )}

        {/* Top Categories List */}
        {topCategories.length > 0 && (
          <View style={styles.topCategoriesContainer}>
            <Text style={styles.chartTitle}>Top Spending Categories</Text>
            {topCategories.map(({categoryId, amount}, index) => {
              const category = getCategoryById(categoryId);
              const percentage = ((amount / expenseTotal) * 100).toFixed(1);
              
              return (
                <View key={categoryId} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryRank}>#{index + 1}</Text>
                    <View
                      style={[
                        styles.categoryIcon,
                        {backgroundColor: category.color + '20'},
                      ]}>
                      <Icon name={category.icon} size={20} color={category.color} />
                    </View>
                    <Text style={styles.categoryRowName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(amount)}
                    </Text>
                    <Text style={styles.categoryPercentage}>{percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Icon name="calendar" size={24} color={APP_COLORS.primary} />
            <Text style={styles.statValue}>{filteredExpenses.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="trending-up" size={24} color={APP_COLORS.warning} />
            <Text style={styles.statValue}>
              {expenseTotal > 0 ? formatCurrency(expenseTotal / filteredExpenses.filter(e => e.type === 'expense').length) : '₹0'}
            </Text>
            <Text style={styles.statLabel}>Avg/Transaction</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="layers" size={24} color={APP_COLORS.secondary} />
            <Text style={styles.statValue}>{topCategories.length}</Text>
            <Text style={styles.statLabel}>Categories Used</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 20,
    paddingTop: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: APP_COLORS.cardBackground,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  periodTextActive: {
    color: '#FFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: APP_COLORS.cardBackground,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 14,
    color: APP_COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  legendAmount: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyChart: {
    backgroundColor: APP_COLORS.cardBackground,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginTop: 12,
  },
  topCategoriesContainer: {
    backgroundColor: APP_COLORS.cardBackground,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryRank: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.textLight,
    width: 30,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: APP_COLORS.text,
    flex: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: APP_COLORS.cardBackground,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default StatisticsScreen;