import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {APP_COLORS} from '../constants/expenseCategories';
import {formatCurrency} from '../utils/calculations';
import {formatTime} from '../utils/dateHelpers';

const ExpenseCard = ({expense, category, onPress, onLongPress}) => {
  const isIncome = expense.type === 'income';
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(expense)}
      onLongPress={() => onLongPress(expense)}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, {backgroundColor: category?.color + '20'}]}>
        <Icon
          name={category?.icon || 'cash'}
          size={24}
          color={category?.color || APP_COLORS.primary}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{expense.title}</Text>
        <View style={styles.details}>
          <Text style={styles.category}>{category?.name || 'Uncategorized'}</Text>
          <Text style={styles.time}>{formatTime(expense.date)}</Text>
        </View>
        {expense.note && (
          <Text style={styles.note} numberOfLines={1}>
            {expense.note}
          </Text>
        )}
      </View>
      
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
        {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
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
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: APP_COLORS.textLight,
  },
  note: {
    fontSize: 12,
    color: APP_COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  income: {
    color: APP_COLORS.income,
  },
  expense: {
    color: APP_COLORS.expense,
  },
});

export default ExpenseCard;
