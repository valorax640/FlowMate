import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {APP_COLORS} from '../constants/expenseCategories';
import {
  loadPeople,
  loadSingleTransactions,
  loadGroups,
  calculatePersonBalance,
  calculateGroupStats,
  getAllGroupMembers,
} from '../utils/peopleStorage';
import {formatCurrency} from '../utils/calculations';

const PeoplePaymentsScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'singles', or 'groups'
  const [people, setPeople] = useState([]);
  const [groups, setGroups] = useState([]);
  const [peopleBalances, setPeopleBalances] = useState({});
  const [groupStats, setGroupStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const loadedPeople = await loadPeople();
      const loadedGroups = await loadGroups();
      const loadedTransactions = await loadSingleTransactions();
      
      // Filter people to only show those with transactions
      const peopleWithTransactions = loadedPeople.filter(person => 
        loadedTransactions.some(transaction => transaction.personId === person.id)
      );
      
      setPeople(peopleWithTransactions);
      setGroups(loadedGroups);
      
      // Calculate balances for people with transactions
      const balances = {};
      for (const person of peopleWithTransactions) {
        balances[person.id] = await calculatePersonBalance(person.id);
      }
      setPeopleBalances(balances);
      
      // Calculate stats for all groups
      const stats = {};
      for (const group of loadedGroups) {
        stats[group.id] = await calculateGroupStats(group.id);
      }
      setGroupStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderPersonItem = ({item}) => {
    const balance = peopleBalances[item.id] || 0;
    const balanceText = balance > 0 
      ? `You'll get ${formatCurrency(Math.abs(balance))}`
      : balance < 0 
      ? `You owe ${formatCurrency(Math.abs(balance))}`
      : 'Settled up';
    
    const balanceColor = balance > 0 
      ? APP_COLORS.income 
      : balance < 0 
      ? APP_COLORS.expense 
      : APP_COLORS.textSecondary;

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => navigation.navigate('SinglePerson', {person: item})}>
        <View style={styles.avatarContainer}>
          <Icon name="person-circle" size={48} color={APP_COLORS.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.phone ? <Text style={styles.itemPhone}>{item.phone}</Text> : null}
          <Text style={[styles.balanceText, {color: balanceColor}]}>
            {balanceText}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({item}) => {
    const stats = groupStats[item.id];
    const memberCount = item.memberIds.length;

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => navigation.navigate('GroupDetail', {group: item})}>
        <View style={styles.avatarContainer}>
          <Icon name="people-circle" size={48} color={APP_COLORS.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPhone}>{memberCount} members</Text>
          {stats && stats.totalExpense > 0 ? (
            <Text style={styles.balanceText}>
              Total: {formatCurrency(stats.totalExpense)}
            </Text>
          ) : (
            <Text style={[styles.balanceText, {color: APP_COLORS.textSecondary}]}>
              No expenses yet
            </Text>
          )}
        </View>
        <Icon name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const isGroupTab = activeTab === 'groups';
    const isAllTab = activeTab === 'all';
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name={isAllTab ? 'people-outline' : isGroupTab ? 'people-outline' : 'person-outline'}
          size={80}
          color={APP_COLORS.textSecondary}
        />
        <Text style={styles.emptyTitle}>
          {isAllTab ? 'No People or Groups Yet' : isGroupTab ? 'No Groups Yet' : 'No People Yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isAllTab
            ? 'Add people or create groups to track transactions'
            : isGroupTab
            ? 'Create a group to split expenses with friends'
            : 'Add people to track your transactions'}
        </Text>
      </View>
    );
  };

  const getDisplayData = () => {
    if (activeTab === 'all') {
      // Combine people and groups with a type indicator
      const peopleData = people.map(p => ({...p, itemType: 'person'}));
      const groupsData = groups.map(g => ({...g, itemType: 'group'}));
      return [...peopleData, ...groupsData];
    } else if (activeTab === 'singles') {
      // Show all people (including group members) in singles tab
      return people.map(p => ({...p, itemType: 'person'}));
    } else {
      return groups.map(g => ({...g, itemType: 'group'}));
    }
  };

  const renderItem = ({item}) => {
    if (item.itemType === 'person') {
      return renderPersonItem({item});
    } else {
      return renderGroupItem({item});
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="people" size={28} color={APP_COLORS.primary} />
          <Text style={styles.headerTitle}>People & Payments</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
          onPress={() => setActiveTab('all')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'all' && styles.activeTabButtonText,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        <View style={styles.tabSpacer} />
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'singles' && styles.activeTabButton]}
          onPress={() => setActiveTab('singles')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'singles' && styles.activeTabButtonText,
            ]}>
            Single
          </Text>
        </TouchableOpacity>
        <View style={styles.tabSpacer} />
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'groups' && styles.activeTabButton]}
          onPress={() => setActiveTab('groups')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'groups' && styles.activeTabButtonText,
            ]}>
            Group
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={getDisplayData()}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'groups') {
            navigation.navigate('AddPerson', {mode: 'group'});
          } else if (activeTab === 'singles') {
            navigation.navigate('AddPerson', {mode: 'single'});
          } else {
            // For 'all' tab, show single person option
            navigation.navigate('AddPerson', {mode: 'single'});
          }
        }}>
        <Icon name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: APP_COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginLeft: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabSpacer: {
    width: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: APP_COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeTabButton: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  itemPhone: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: APP_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default PeoplePaymentsScreen;
