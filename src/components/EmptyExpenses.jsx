import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {APP_COLORS} from '../constants/expenseCategories';

const EmptyExpenses = ({message = "No expenses yet"}) => {
  return (
    <View style={styles.container}>
      <Icon name="wallet-outline" size={80} color={APP_COLORS.textLight} />
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.subtitle}>
        Tap the + button to add your first expense
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default EmptyExpenses;