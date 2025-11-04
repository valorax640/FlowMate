import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {APP_COLORS} from '../constants/expenseCategories';
import {formatCurrency, calculateBudgetProgress} from '../utils/calculations';

const BudgetProgress = ({category, spent, budget, onPress}) => {
  const progress = calculateBudgetProgress(spent, budget);
  const remaining = budget - spent;
  const isOverBudget = spent > budget;
  
  const getProgressColor = () => {
    if (isOverBudget) return APP_COLORS.danger;
    if (progress > 80) return APP_COLORS.warning;
    return APP_COLORS.success;
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View
            style={[
              styles.iconContainer,
              {backgroundColor: category.color + '20'},
            ]}>
            <Icon name={category.icon} size={20} color={category.color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.budgetText}>
              {formatCurrency(spent)} of {formatCurrency(budget)}
            </Text>
          </View>
        </View>
        
        <View style={styles.remainingContainer}>
          <Text style={[styles.remaining, isOverBudget && styles.overBudget]}>
            {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(remaining))}
          </Text>
          <Text style={styles.remainingLabel}>
            {isOverBudget ? 'Over' : 'Left'}
          </Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
      
      <Text style={[styles.percentage, {color: getProgressColor()}]}>
        {progress.toFixed(0)}% used
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  budgetText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  remainingContainer: {
    alignItems: 'flex-end',
  },
  remaining: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.success,
  },
  overBudget: {
    color: APP_COLORS.danger,
  },
  remainingLabel: {
    fontSize: 11,
    color: APP_COLORS.textLight,
    marginTop: 2,
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
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default BudgetProgress;