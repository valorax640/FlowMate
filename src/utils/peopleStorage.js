import AsyncStorage from '@react-native-async-storage/async-storage';

const PEOPLE_KEY = '@expense_tracker_people';
const SINGLE_TRANSACTIONS_KEY = '@expense_tracker_single_transactions';
const GROUPS_KEY = '@expense_tracker_groups';
const GROUP_EXPENSES_KEY = '@expense_tracker_group_expenses';

// ========== PEOPLE (Contacts) ==========

export const savePeople = async (people) => {
  try {
    await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
  } catch (error) {
    console.error('Error saving people:', error);
  }
};

export const loadPeople = async () => {
  try {
    const data = await AsyncStorage.getItem(PEOPLE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading people:', error);
    return [];
  }
};

export const addPerson = async (person) => {
  try {
    const people = await loadPeople();
    const newPerson = {
      id: Date.now().toString(),
      name: person.name,
      phone: person.phone || '',
      createdAt: new Date().toISOString(),
    };
    people.push(newPerson);
    await savePeople(people);
    return newPerson;
  } catch (error) {
    console.error('Error adding person:', error);
    return null;
  }
};

export const deletePerson = async (personId) => {
  try {
    const people = await loadPeople();
    const filtered = people.filter(p => p.id !== personId);
    await savePeople(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting person:', error);
    return false;
  }
};

// ========== SINGLE TRANSACTIONS (Give/Got) ==========

export const saveSingleTransactions = async (transactions) => {
  try {
    await AsyncStorage.setItem(SINGLE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving single transactions:', error);
  }
};

export const loadSingleTransactions = async () => {
  try {
    const data = await AsyncStorage.getItem(SINGLE_TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading single transactions:', error);
    return [];
  }
};

export const addSingleTransaction = async (transaction) => {
  try {
    const transactions = await loadSingleTransactions();
    const newTransaction = {
      id: Date.now().toString(),
      personId: transaction.personId,
      type: transaction.type, // 'give' or 'got'
      amount: parseFloat(transaction.amount),
      note: transaction.note || '',
      date: transaction.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    await saveSingleTransactions(transactions);
    return newTransaction;
  } catch (error) {
    console.error('Error adding single transaction:', error);
    return null;
  }
};

export const deleteSingleTransaction = async (transactionId) => {
  try {
    const transactions = await loadSingleTransactions();
    const filtered = transactions.filter(t => t.id !== transactionId);
    await saveSingleTransactions(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting single transaction:', error);
    return false;
  }
};

// Calculate balance for a single person
// Positive = they owe you, Negative = you owe them
export const calculatePersonBalance = async (personId) => {
  try {
    const transactions = await loadSingleTransactions();
    const personTransactions = transactions.filter(t => t.personId === personId);
    
    let balance = 0;
    personTransactions.forEach(t => {
      if (t.type === 'give') {
        balance += t.amount; // You gave them money (they owe you)
      } else if (t.type === 'got') {
        balance -= t.amount; // You got money from them (you owe them)
      }
    });
    
    return balance;
  } catch (error) {
    console.error('Error calculating person balance:', error);
    return 0;
  }
};

// ========== GROUPS ==========

export const saveGroups = async (groups) => {
  try {
    await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error('Error saving groups:', error);
  }
};

export const loadGroups = async () => {
  try {
    const data = await AsyncStorage.getItem(GROUPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading groups:', error);
    return [];
  }
};

export const addGroup = async (group) => {
  try {
    const groups = await loadGroups();
    const newGroup = {
      id: Date.now().toString(),
      name: group.name,
      memberIds: group.memberIds || [],
      createdAt: new Date().toISOString(),
    };
    groups.push(newGroup);
    await saveGroups(groups);
    return newGroup;
  } catch (error) {
    console.error('Error adding group:', error);
    return null;
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const groups = await loadGroups();
    const filtered = groups.filter(g => g.id !== groupId);
    await saveGroups(filtered);
    
    // Also delete all group expenses
    const expenses = await loadGroupExpenses();
    const filteredExpenses = expenses.filter(e => e.groupId !== groupId);
    await saveGroupExpenses(filteredExpenses);
    
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    return false;
  }
};

// ========== GROUP EXPENSES ==========

export const saveGroupExpenses = async (expenses) => {
  try {
    await AsyncStorage.setItem(GROUP_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving group expenses:', error);
  }
};

export const loadGroupExpenses = async () => {
  try {
    const data = await AsyncStorage.getItem(GROUP_EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading group expenses:', error);
    return [];
  }
};

export const addGroupExpense = async (expense) => {
  try {
    const expenses = await loadGroupExpenses();
    const newExpense = {
      id: Date.now().toString(),
      groupId: expense.groupId,
      description: expense.description || '',
      amount: parseFloat(expense.amount),
      paidBy: expense.paidBy, // personId who paid
      date: expense.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    await saveGroupExpenses(expenses);
    return newExpense;
  } catch (error) {
    console.error('Error adding group expense:', error);
    return null;
  }
};

export const deleteGroupExpense = async (expenseId) => {
  try {
    const expenses = await loadGroupExpenses();
    const filtered = expenses.filter(e => e.id !== expenseId);
    await saveGroupExpenses(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting group expense:', error);
    return false;
  }
};

// ========== GROUP CALCULATIONS ==========

// Calculate group statistics
export const calculateGroupStats = async (groupId) => {
  try {
    const group = (await loadGroups()).find(g => g.id === groupId);
    if (!group) return null;
    
    const expenses = (await loadGroupExpenses()).filter(e => e.groupId === groupId);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const memberCount = group.memberIds.length;
    const fairShare = memberCount > 0 ? totalExpense / memberCount : 0;
    
    // Calculate each person's balance
    const balances = {};
    group.memberIds.forEach(memberId => {
      balances[memberId] = -fairShare; // Everyone starts owing their fair share
    });
    
    // Add back what each person paid
    expenses.forEach(expense => {
      if (balances[expense.paidBy] !== undefined) {
        balances[expense.paidBy] += expense.amount;
      }
    });
    
    return {
      totalExpense,
      fairShare,
      balances,
      memberCount,
    };
  } catch (error) {
    console.error('Error calculating group stats:', error);
    return null;
  }
};

// Simplify transactions using creditor-debtor algorithm
export const simplifyTransactions = (balances, people) => {
  // balances is an object: { personId: balance }
  // Positive balance = should receive money (creditor)
  // Negative balance = should pay money (debtor)
  
  const creditors = [];
  const debtors = [];
  
  // Separate into creditors and debtors
  Object.entries(balances).forEach(([personId, balance]) => {
    const person = people.find(p => p.id === personId);
    const name = person ? person.name : 'Unknown';
    
    if (balance > 0.01) { // Creditor (should receive)
      creditors.push({ personId, name, amount: balance });
    } else if (balance < -0.01) { // Debtor (should pay)
      debtors.push({ personId, name, amount: Math.abs(balance) });
    }
  });
  
  // Sort by amount (largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  const settlements = [];
  let i = 0; // creditor index
  let j = 0; // debtor index
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const settleAmount = Math.min(creditor.amount, debtor.amount);
    
    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.personId,
        fromName: debtor.name,
        to: creditor.personId,
        toName: creditor.name,
        amount: settleAmount,
      });
    }
    
    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;
    
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }
  
  return settlements;
};

// Get simplified settlements for a group
export const getGroupSettlements = async (groupId) => {
  try {
    const stats = await calculateGroupStats(groupId);
    if (!stats) return [];
    
    const people = await loadPeople();
    return simplifyTransactions(stats.balances, people);
  } catch (error) {
    console.error('Error getting group settlements:', error);
    return [];
  }
};

// Get all people who are members of groups (for displaying in Single tab)
export const getAllGroupMembers = async () => {
  try {
    const groups = await loadGroups();
    const people = await loadPeople();
    const memberIds = new Set();
    
    groups.forEach(group => {
      group.memberIds.forEach(memberId => memberIds.add(memberId));
    });
    
    return people.filter(person => memberIds.has(person.id));
  } catch (error) {
    console.error('Error getting group members:', error);
    return [];
  }
};
