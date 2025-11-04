import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {APP_COLORS} from '../constants/expenseCategories';
import {formatCurrency} from '../utils/calculations';

const SummaryCard = ({income, expenses, balance}) => {
  const isNegative = balance < 0;
  const balanceColor = isNegative ? '#FF6B6B' : '#FFF';
  
  return (
    <LinearGradient
      colors={[APP_COLORS.primary, '#00B894']}
      style={styles.card}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <View style={styles.header}>
        <Text style={styles.label}>Total Balance</Text>
        <Icon name="wallet" size={24} color="#FFF" />
      </View>
      
      <Text style={[styles.balance, {color: balanceColor}]}>
        {isNegative ? '-' : ''}{formatCurrency(Math.abs(balance))}
      </Text>
      
      <View style={styles.divider} />
      
      <View style={styles.row}>
        <View style={styles.item}>
          <View style={styles.itemHeader}>
            <Icon name="arrow-down-circle" size={16} color="#FFFFFF" />
            <Text style={styles.itemLabel}>Income</Text>
          </View>
          <Text style={styles.itemValue}>{formatCurrency(income)}</Text>
        </View>
        
        <View style={styles.item}>
          <View style={styles.itemHeader}>
            <Icon name="arrow-up-circle" size={16} color="#FFFFFF" />
            <Text style={styles.itemLabel}>Expenses</Text>
          </View>
          <Text style={styles.itemValue}>{formatCurrency(expenses)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: APP_COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  balance: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  itemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default SummaryCard;