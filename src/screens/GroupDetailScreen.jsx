import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';
import {APP_COLORS} from '../constants/expenseCategories';
import {
  loadPeople,
  loadGroupExpenses,
  calculateGroupStats,
  getGroupSettlements,
  addGroupExpense,
  deleteGroupExpense,
  deleteGroup,
  addPerson,
  saveGroups,
  loadGroups,
} from '../utils/peopleStorage';
import {formatCurrency} from '../utils/calculations';

const GroupDetailScreen = ({route, navigation}) => {
  const {group} = route.params;
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'settlements'
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(null);
  
  // Add member modal states
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const allPeople = await loadPeople();
      const groupPeople = allPeople.filter(p => group.memberIds.includes(p.id));
      setPeople(groupPeople);
      
      const allExpenses = await loadGroupExpenses();
      const groupExpenses = allExpenses
        .filter(e => e.groupId === group.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(groupExpenses);
      
      const groupStats = await calculateGroupStats(group.id);
      setStats(groupStats);
      
      const groupSettlements = await getGroupSettlements(group.id);
      setSettlements(groupSettlements);
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleAddExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!paidBy) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }

    try {
      await addGroupExpense({
        groupId: group.id,
        description,
        amount: parseFloat(amount),
        paidBy,
      });
      
      setAmount('');
      setDescription('');
      setPaidBy(null);
      setModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleDeleteExpense = (expenseId) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGroupExpense(expenseId);
            loadData();
          },
        },
      ],
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? All expenses will also be deleted.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGroup(group.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to add members.',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleAddMembers = async () => {
    const hasPermission = await requestContactsPermission();
    
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please grant contacts permission to use this feature.');
      return;
    }

    try {
      const contacts = await Contacts.getAll();
      setDeviceContacts(contacts);
      setSelectedContacts([]);
      setSearchQuery('');
      setAddMemberModalVisible(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    }
  };

  const toggleContactSelection = (contact) => {
    const isSelected = selectedContacts.some(c => c.recordID === contact.recordID);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.recordID !== contact.recordID));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleAddSelectedMembers = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Selection', 'Please select at least one contact');
      return;
    }

    try {
      const newMemberIds = [];
      for (const contact of selectedContacts) {
        const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0
          ? contact.phoneNumbers[0].number
          : '';
        
        const newPerson = await addPerson({
          name: contact.displayName || contact.givenName || 'Unknown',
          phone: phoneNumber,
        });
        
        if (newPerson) {
          newMemberIds.push(newPerson.id);
        }
      }
      
      // Update group with new members
      const groups = await loadGroups();
      const updatedGroups = groups.map(g => {
        if (g.id === group.id) {
          return {
            ...g,
            memberIds: [...new Set([...g.memberIds, ...newMemberIds])],
          };
        }
        return g;
      });
      await saveGroups(updatedGroups);
      
      // Update route params
      group.memberIds = [...new Set([...group.memberIds, ...newMemberIds])];
      
      await loadData();
      setAddMemberModalVisible(false);
      Alert.alert('Success', `Added ${selectedContacts.length} member(s)`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add members');
    }
  };

  const getFilteredContacts = () => {
    if (!searchQuery.trim()) {
      return deviceContacts;
    }
    
    const query = searchQuery.toLowerCase();
    return deviceContacts.filter(contact => {
      const name = (contact.displayName || contact.givenName || '').toLowerCase();
      const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0
        ? contact.phoneNumbers[0].number
        : '';
      return name.includes(query) || phone.includes(query);
    });
  };

  const getPersonName = (personId) => {
    const person = people.find(p => p.id === personId);
    return person ? person.name : 'Unknown';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderExpense = ({item}) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onLongPress={() => handleDeleteExpense(item.id)}>
      <View style={styles.expenseLeft}>
        <Icon name="receipt" size={24} color={APP_COLORS.primary} />
        <View style={styles.expenseTextContainer}>
          <Text style={styles.expenseDescription}>
            {item.description || 'Expense'}
          </Text>
          <Text style={styles.expensePaidBy}>
            Paid by {getPersonName(item.paidBy)}
          </Text>
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSettlement = ({item}) => (
    <View style={styles.settlementItem}>
      <View style={styles.settlementFlow}>
        <View style={styles.settlementPerson}>
          <Icon name="person-circle" size={32} color={APP_COLORS.expense} />
          <Text style={styles.settlementName}>{item.fromName}</Text>
        </View>
        <View style={styles.settlementArrow}>
          <Text style={styles.settlementAmount}>
            {formatCurrency(item.amount)}
          </Text>
          <Icon name="arrow-forward" size={20} color={APP_COLORS.primary} />
        </View>
        <View style={styles.settlementPerson}>
          <Icon name="person-circle" size={32} color={APP_COLORS.income} />
          <Text style={styles.settlementName}>{item.toName}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={APP_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleAddMembers} style={styles.headerButton}>
            <Icon name="person-add" size={22} color={APP_COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteGroup} style={styles.headerButton}>
            <Icon name="trash-outline" size={22} color={APP_COLORS.expense} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Expense</Text>
          <Text style={styles.statValue}>
            {formatCurrency(stats?.totalExpense || 0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Fair Share</Text>
          <Text style={styles.statValue}>
            {formatCurrency(stats?.fairShare || 0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Members</Text>
          <Text style={styles.statValue}>{stats?.memberCount || 0}</Text>
        </View>
      </ScrollView>

      {/* Member Balances */}
      {stats && stats.balances && (
        <View style={styles.balancesContainer}>
          <Text style={styles.sectionTitle}>Member Balances</Text>
          <View style={styles.balancesList}>
            {Object.entries(stats.balances).map(([personId, balance]) => {
              const person = people.find(p => p.id === personId);
              const balanceColor = balance > 0.01 
                ? APP_COLORS.income 
                : balance < -0.01 
                ? APP_COLORS.expense 
                : APP_COLORS.textSecondary;
              
              const balanceText = balance > 0.01
                ? `Gets back ${formatCurrency(balance)}`
                : balance < -0.01
                ? `Owes ${formatCurrency(Math.abs(balance))}`
                : 'Settled';

              return (
                <View key={personId} style={styles.balanceItem}>
                  <View style={styles.balanceLeft}>
                    <Icon name="person-circle" size={24} color={APP_COLORS.primary} />
                    <Text style={styles.balanceName}>
                      {person ? person.name : 'Unknown'}
                    </Text>
                  </View>
                  <Text style={[styles.balanceAmount, {color: balanceColor}]}>
                    {balanceText}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'expenses' && styles.activeTabText,
            ]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settlements' && styles.activeTab]}
          onPress={() => setActiveTab('settlements')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'settlements' && styles.activeTabText,
            ]}>
            Settlements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'expenses' ? (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="receipt-outline" size={60} color={APP_COLORS.textSecondary} />
              <Text style={styles.emptyText}>No expenses yet</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={settlements}
          renderItem={renderSettlement}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="checkmark-circle-outline" size={60} color={APP_COLORS.income} />
              <Text style={styles.emptyText}>
                {expenses.length === 0 ? 'No settlements yet' : 'All settled up!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Add Expense Button */}
      {activeTab === 'expenses' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}>
          <Icon name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Add Expense Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Group Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={APP_COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What was this for?"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.inputLabel}>Paid By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paidByContainer}>
              {people.map(person => (
                <TouchableOpacity
                  key={person.id}
                  style={[
                    styles.paidByOption,
                    paidBy === person.id && styles.paidByOptionSelected,
                  ]}
                  onPress={() => setPaidBy(person.id)}>
                  <Icon
                    name="person-circle"
                    size={32}
                    color={paidBy === person.id ? APP_COLORS.primary : APP_COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paidByName,
                      paidBy === person.id && styles.paidByNameSelected,
                    ]}>
                    {person.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddExpense}>
              <Text style={styles.submitButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={addMemberModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAddMemberModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddMemberModalVisible(false)}>
              <Icon name="close" size={24} color={APP_COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Add Members ({selectedContacts.length})
            </Text>
            <TouchableOpacity onPress={handleAddSelectedMembers}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={APP_COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color={APP_COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={getFilteredContacts()}
            keyExtractor={(item) => item.recordID}
            renderItem={({item}) => {
              const isSelected = selectedContacts.some(c => c.recordID === item.recordID);
              const phoneNumber = item.phoneNumbers && item.phoneNumbers.length > 0
                ? item.phoneNumbers[0].number
                : 'No phone';
              
              return (
                <TouchableOpacity
                  style={[
                    styles.contactItem,
                    isSelected && styles.contactItemSelected,
                  ]}
                  onPress={() => toggleContactSelection(item)}>
                  <View style={styles.contactLeft}>
                    <Icon
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={isSelected ? APP_COLORS.primary : APP_COLORS.textSecondary}
                    />
                    <View style={styles.contactTextContainer}>
                      <Text style={styles.contactName}>
                        {item.displayName || item.givenName || 'Unknown'}
                      </Text>
                      <Text style={styles.contactPhone}>{phoneNumber}</Text>
                    </View>
                  </View>
                  <Icon name="person-circle" size={32} color={APP_COLORS.primary} />
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: APP_COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 12,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    backgroundColor: APP_COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  balancesContainer: {
    backgroundColor: APP_COLORS.cardBackground,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  balancesList: {},
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceName: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: APP_COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  activeTabText: {
    color: APP_COLORS.primary,
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    padding: 14,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: APP_COLORS.text,
  },
  expensePaidBy: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  expenseDate: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  settlementItem: {
    backgroundColor: APP_COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settlementFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settlementPerson: {
    alignItems: 'center',
    flex: 1,
  },
  settlementName: {
    fontSize: 13,
    color: APP_COLORS.text,
    marginTop: 4,
    textAlign: 'center',
  },
  settlementArrow: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.primary,
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    marginTop: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: APP_COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: APP_COLORS.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paidByContainer: {
    marginBottom: 12,
  },
  paidByOption: {
    alignItems: 'center',
    padding: 12,
    marginRight: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paidByOptionSelected: {
    borderColor: APP_COLORS.primary,
    backgroundColor: APP_COLORS.background,
  },
  paidByName: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
  },
  paidByNameSelected: {
    color: APP_COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: APP_COLORS.text,
    marginLeft: 8,
    padding: 0,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: APP_COLORS.cardBackground,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contactItemSelected: {
    borderColor: APP_COLORS.primary,
    backgroundColor: `${APP_COLORS.primary}10`,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '500',
    color: APP_COLORS.text,
  },
  contactPhone: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
});

export default GroupDetailScreen;
