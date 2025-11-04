import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {APP_COLORS} from '../constants/expenseCategories';

const CategorySelector = ({categories, selectedCategory, onSelect}) => {
  // Add null check and default fallback
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {categories.map(category => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && {
                  backgroundColor: category.color + '15',
                  borderColor: category.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => onSelect(category.id)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.iconContainer,
                  {backgroundColor: category.color + '20'},
                  isSelected && {
                    backgroundColor: category.color,
                  },
                ]}>
                <Icon
                  name={category.icon}
                  size={26}
                  color={isSelected ? '#FFFFFF' : category.color}
                />
              </View>
              <Text
                style={[
                  styles.categoryName,
                  isSelected && {
                    fontWeight: '700',
                    color: category.color,
                  },
                ]}
                numberOfLines={1}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    width: 90,
    backgroundColor: APP_COLORS.cardBackground,
  },
  categoryItemSelected: {
    // Active state is applied inline
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameSelected: {
    // Active state is applied inline
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default CategorySelector;