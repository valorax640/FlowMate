import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Text} from 'react-native';
import {useDateContext} from '../context/DateContext';
import CommonHeader from '../components/CommonHeader';
import SummaryCard from '../components/SummaryCard';
import ExpenseCard from '../components/ExpenseCard';
import EmptyExpenses from '../components/EmptyExpenses';
import {APP_COLORS, DEFAULT_CATEGORIES, INCOME_CATEGORIES} from '../constants/expenseCategories';
import {loadExpenses, saveExpenses, loadCategories} from '../utils/expenseStorage';
import {calculateTotal, groupExpensesByDate} from '../utils/calculations';
import {isThisMonth, formatDate} from '../utils/dateHelpers';

const HomeScreen = () => {
  const navigation = useNavigation();
  const {selectedMonth, selectedYear} = useDateContext();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([...DEFAULT_CATEGORIES, ...INCOME_CATEGORIES]);
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

  const handleAddExpense = () => {
    navigation.navigate('AddExpense');
  };

  const handleEditExpense = (expense) => {
    navigation.navigate('AddExpense', {expense});
  };

  const handleDeleteExpense = (expense) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedExpenses = expenses.filter(e => e.id !== expense.id);
            setExpenses(updatedExpenses);
            await saveExpenses(updatedExpenses);
          },
        },
      ],
    );
  };

  const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id) || categories[categories.length - 1];
  };

  const filterExpensesBySelectedDate = (expensesList) => {
    return expensesList.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === selectedMonth && 
             expenseDate.getFullYear() === selectedYear;
    });
  };

  const thisMonthExpenses = filterExpensesBySelectedDate(expenses);
  const income = calculateTotal(thisMonthExpenses, 'income');
  const expenseTotal = calculateTotal(thisMonthExpenses, 'expense');
  const balance = income - expenseTotal;

  // Filter sections to only show expenses from selected month/year
  const allSections = groupExpensesByDate(expenses);
  const sections = allSections.map(section => ({
    ...section,
    data: section.data.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === selectedMonth && 
             expenseDate.getFullYear() === selectedYear;
    })
  })).filter(section => section.data.length > 0); // Remove empty sections

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CommonHeader title="FlowMate" />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ExpenseCard
            expense={item}
            category={getCategoryById(item.categoryId)}
            onPress={handleEditExpense}
            onLongPress={handleDeleteExpense}
          />
        )}
        renderSectionHeader={({section}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{formatDate(section.timestamp)}</Text>
          </View>
        )}
        ListHeaderComponent={
          <SummaryCard
            income={income}
            expenses={expenseTotal}
            balance={balance}
          />
        }
        ListEmptyComponent={<EmptyExpenses />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={APP_COLORS.primary}
            colors={[APP_COLORS.primary]}
          />
        }
        stickySectionHeadersEnabled={false}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
        <Icon name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: APP_COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;