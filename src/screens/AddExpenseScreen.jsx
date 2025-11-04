import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDateContext} from '../context/DateContext';
import CategorySelector from '../components/CategorySelector';
import {APP_COLORS, DEFAULT_CATEGORIES, INCOME_CATEGORIES} from '../constants/expenseCategories';
import {generateId, saveExpenses, loadExpenses, loadCategories} from '../utils/expenseStorage';

const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {selectedMonth, selectedYear} = useDateContext();
  const editExpense = route.params?.expense;

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  
  // Initialize date with selected month/year from context
  const getInitialDate = () => {
    if (editExpense) {
      return new Date(editExpense.date);
    }
    // Create date using selected month and year from context
    return new Date(selectedYear, selectedMonth, new Date().getDate());
  };
  
  const [date, setDate] = useState(getInitialDate());
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);

  // Get the appropriate categories based on type
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    loadCategoriesData();
  }, []);

  useEffect(() => {
    if (editExpense) {
      setType(editExpense.type);
      setAmount(editExpense.amount.toString());
      setTitle(editExpense.title);
      setNote(editExpense.note || '');
      setCategoryId(editExpense.categoryId);
      setDate(new Date(editExpense.date));
    }
  }, [editExpense]);

  const loadCategoriesData = async () => {
    try {
      const loadedCategories = await loadCategories();
      if (loadedCategories && Array.isArray(loadedCategories)) {
        // Split categories by type
        const expenseCats = loadedCategories.filter(cat => cat.type === 'expense' || !cat.type);
        const incomeCats = loadedCategories.filter(cat => cat.type === 'income');
        
        setExpenseCategories(expenseCats.length > 0 ? expenseCats : DEFAULT_CATEGORIES);
        setIncomeCategories(incomeCats.length > 0 ? incomeCats : INCOME_CATEGORIES);
      } else {
        // Fallback to default categories if loading fails or returns invalid data
        setExpenseCategories(DEFAULT_CATEGORIES);
        setIncomeCategories(INCOME_CATEGORIES);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setExpenseCategories(DEFAULT_CATEGORIES);
      setIncomeCategories(INCOME_CATEGORIES);
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title.');
      return;
    }

    try {
      const expenses = await loadExpenses();
      // Ensure expenses is always an array
      const expensesArray = Array.isArray(expenses) ? expenses : [];
      const expenseData = {
        id: editExpense ? editExpense.id : generateId(),
        type,
        amount: parseFloat(amount),
        title: title.trim(),
        note: note.trim(),
        categoryId,
        date: date.getTime(),
        createdAt: editExpense ? editExpense.createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      let updatedExpenses;
      if (editExpense) {
        updatedExpenses = expensesArray.map(e => e.id === editExpense.id ? expenseData : e);
      } else {
        updatedExpenses = [expenseData, ...expensesArray];
      }

      await saveExpenses(updatedExpenses);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction.');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const expenses = await loadExpenses();
              const expensesArray = Array.isArray(expenses) ? expenses : [];
              const updatedExpenses = expensesArray.filter(e => e.id !== editExpense.id);
              await saveExpenses(updatedExpenses);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction.');
            }
          },
        },
      ],
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          {editExpense && (
            <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
              <Icon name="trash-outline" size={24} color={APP_COLORS.danger} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, amount, title, note, categoryId, type, date, editExpense]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled">
        
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && [
                styles.typeButtonActive,
                {
                  backgroundColor: APP_COLORS.expense,
                  borderColor: APP_COLORS.expense,
                }
              ],
            ]}
            onPress={() => {
              setType('expense');
              setCategoryId('food');
            }}>
            <Icon
              name="arrow-up-circle"
              size={24}
              color={type === 'expense' ? '#FFFFFF' : APP_COLORS.textLight}
            />
            <Text
              style={[
                styles.typeText,
                type === 'expense' && {color: '#FFFFFF', fontWeight: '700'},
              ]}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && [
                styles.typeButtonActive,
                {
                  backgroundColor: APP_COLORS.income,
                  borderColor: APP_COLORS.income,
                }
              ],
            ]}
            onPress={() => {
              setType('income');
              setCategoryId('salary');
            }}>
            <Icon
              name="arrow-down-circle"
              size={24}
              color={type === 'income' ? '#FFFFFF' : APP_COLORS.textLight}
            />
            <Text
              style={[
                styles.typeText,
                type === 'income' && {color: '#FFFFFF', fontWeight: '700'},
              ]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={APP_COLORS.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus={!editExpense}
            maxLength={10}
          />
        </View>

        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Grocery shopping"
            placeholderTextColor={APP_COLORS.textLight}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
        </View>

        {/* Category Selector - Show for both expense and income */}
        <CategorySelector
          categories={currentCategories}
          selectedCategory={categoryId}
          onSelect={setCategoryId}
        />

        {/* Note Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Add a note..."
            placeholderTextColor={APP_COLORS.textLight}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
        </View>

        {/* Date Display */}
        <View style={styles.dateContainer}>
          <Icon name="calendar" size={20} color={APP_COLORS.textSecondary} />
          <Text style={styles.dateText}>
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 16,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.cardBackground,
  },
  typeButtonActive: {
    // Active state is applied inline for better control
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginLeft: 8,
  },
  typeTextActive: {
    color: APP_COLORS.text,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  currency: {
    fontSize: 48,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '700',
    color: APP_COLORS.text,
    minWidth: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: APP_COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: APP_COLORS.text,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  noteInput: {
    height: 100,
    paddingTop: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  dateText: {
    fontSize: 15,
    color: APP_COLORS.textSecondary,
    marginLeft: 12,
  },
});

export default AddExpenseScreen;