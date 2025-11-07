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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {APP_COLORS} from '../constants/expenseCategories';
import {
  loadSingleTransactions,
  calculatePersonBalance,
  addSingleTransaction,
  deleteSingleTransaction,
  deletePerson,
} from '../utils/peopleStorage';
import {formatCurrency} from '../utils/calculations';

const SinglePersonScreen = ({route, navigation}) => {
  const {person} = route.params;
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('give'); // 'give' or 'got'
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const loadData = async () => {
    try {
      const allTransactions = await loadSingleTransactions();
      const personTransactions = allTransactions
        .filter(t => t.personId === person.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(personTransactions);
      
      const bal = await calculatePersonBalance(person.id);
      setBalance(bal);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleAddTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addSingleTransaction({
        personId: person.id,
        type: transactionType,
        amount: parseFloat(amount),
        note,
      });
      
      setAmount('');
      setNote('');
      setModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const handleDeleteTransaction = (transactionId) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSingleTransaction(transactionId);
            loadData();
          },
        },
      ],
    );
  };

  const handleDeletePerson = () => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${person.name}? All transactions will also be deleted.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePerson(person.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const renderTransaction = ({item}) => {
    const isGive = item.type === 'give';
    const icon = isGive ? 'arrow-up-circle' : 'arrow-down-circle';
    const color = isGive ? APP_COLORS.expense : APP_COLORS.income;
    const prefix = isGive ? 'You gave' : 'You got';

    return (
      <TouchableOpacity
        style={[
          styles.transactionItem,
          isGive ? styles.giveTransaction : styles.gotTransaction,
        ]}
        onLongPress={() => handleDeleteTransaction(item.id)}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <Icon name={icon} size={24} color={color} />
            <View style={styles.transactionTextContainer}>
              <Text style={[styles.transactionAmount, {color}]}>
                {formatCurrency(item.amount)}
              </Text>
              <Text style={styles.transactionLabel}>{prefix}</Text>
            </View>
          </View>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        {item.note ? (
          <Text style={styles.transactionNote}>{item.note}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const balanceText = balance > 0 
    ? `${person.name} owes you`
    : balance < 0 
    ? `You owe ${person.name}`
    : 'Settled up';
  
  const balanceColor = balance > 0 
    ? APP_COLORS.income 
    : balance < 0 
    ? APP_COLORS.expense 
    : APP_COLORS.textSecondary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={APP_COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{person.name}</Text>
          {person.phone ? (
            <Text style={styles.headerPhone}>{person.phone}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={handleDeletePerson}>
          <Icon name="trash-outline" size={24} color={APP_COLORS.expense} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{balanceText}</Text>
        <Text style={[styles.balanceAmount, {color: balanceColor}]}>
          {formatCurrency(Math.abs(balance))}
        </Text>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-outline" size={60} color={APP_COLORS.textSecondary} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: APP_COLORS.expense}]}
          onPress={() => {
            setTransactionType('give');
            setModalVisible(true);
          }}>
          <Icon name="arrow-up" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>You Gave</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: APP_COLORS.income}]}
          onPress={() => {
            setTransactionType('got');
            setModalVisible(true);
          }}>
          <Icon name="arrow-down" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>You Got</Text>
        </TouchableOpacity>
      </View>

      {/* Add Transaction Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {transactionType === 'give' ? 'You Gave Money' : 'You Got Money'}
              </Text>
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

            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="What was this for?"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    transactionType === 'give'
                      ? APP_COLORS.expense
                      : APP_COLORS.income,
                },
              ]}
              onPress={handleAddTransaction}>
              <Text style={styles.submitButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  headerPhone: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: APP_COLORS.cardBackground,
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  transactionItem: {
    backgroundColor: APP_COLORS.cardBackground,
    padding: 14,
    borderRadius: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
  },
  giveTransaction: {
    borderLeftColor: APP_COLORS.expense,
  },
  gotTransaction: {
    borderLeftColor: APP_COLORS.income,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionTextContainer: {
    marginLeft: 10,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionLabel: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  transactionNote: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginTop: 8,
    marginLeft: 34,
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
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: APP_COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
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
});

export default SinglePersonScreen;
