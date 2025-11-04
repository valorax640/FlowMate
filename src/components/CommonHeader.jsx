import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import MonthYearPicker from './MonthYearPicker';
import {APP_COLORS} from '../constants/expenseCategories';

const CommonHeader = ({title, showMonthPicker = true}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image
          source={require('../../assets/image/expenses.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      {showMonthPicker && (
        <View style={styles.rightSection}>
          <MonthYearPicker />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_COLORS.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.text,
  },
  rightSection: {
    marginLeft: 8,
  },
});

export default CommonHeader;
