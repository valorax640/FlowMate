import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    PermissionsAndroid,
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';
import { APP_COLORS } from '../constants/expenseCategories';
import { addPerson, addGroup, loadPeople } from '../utils/peopleStorage';

const AddPersonScreen = ({navigation, route}) => {
  const {fromGroup = false, onAddMembers = null, mode = 'single'} = route.params || {};
  
  // Single person states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Group states
  const [groupName, setGroupName] = useState('');
  const [people, setPeople] = useState([]);
  const [selectedPeople, setSelectedPeople] = useState([]);
  
  // Contact picker states
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(mode); // 'single' or 'group'
  const [selectedContacts, setSelectedContacts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (selectionMode === 'group') {
        loadData();
      }
    }, [selectionMode]),
  );

  const loadData = async () => {
    try {
      const loadedPeople = await loadPeople();
      setPeople(loadedPeople);
    } catch (error) {
      console.error('Error loading people:', error);
    }
  };

    const requestContactsPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                    {
                        title: 'Contacts Permission',
                        message: 'This app needs access to your contacts to add people.',
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

  const handlePickContact = async () => {
    const hasPermission = await requestContactsPermission();
    
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please grant contacts permission to use this feature.');
      return;
    }

    try {
      const contacts = await Contacts.getAll();
      setDeviceContacts(contacts);
      setSearchQuery('');
      setSelectionMode(fromGroup ? 'group' : 'single');
      setSelectedContacts([]);
      setContactModalVisible(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    }
  };

  const togglePersonSelection = (personId) => {
    if (selectedPeople.includes(personId)) {
      setSelectedPeople(selectedPeople.filter(id => id !== personId));
    } else {
      setSelectedPeople([...selectedPeople, personId]);
    }
  };

  const toggleContactSelection = (contact) => {
    const isSelected = selectedContacts.some(c => c.recordID === contact.recordID);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.recordID !== contact.recordID));
    } else {
      if (selectionMode === 'single') {
        setSelectedContacts([contact]);
      } else {
        setSelectedContacts([...selectedContacts, contact]);
      }
    }
  };

  const handleSelectContact = (contact) => {
    if (selectionMode === 'single') {
      setName(contact.displayName || contact.givenName || '');
      const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0
        ? contact.phoneNumbers[0].number
        : '';
      setPhone(phoneNumber);
      setContactModalVisible(false);
      setSearchQuery('');
    } else {
      // Group mode - toggle selection
      toggleContactSelection(contact);
    }
  };

  const handleDoneSelection = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Selection', 'Please select at least one contact');
      return;
    }

    if (onAddMembers) {
      // Called from GroupDetailScreen to add members
      onAddMembers(selectedContacts);
      setContactModalVisible(false);
      navigation.goBack();
    } else if (selectionMode === 'group') {
      // Adding contacts for group creation
      try {
        const newPeopleIds = [];
        for (const contact of selectedContacts) {
          const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0
            ? contact.phoneNumbers[0].number
            : '';
          
          const newPerson = await addPerson({
            name: contact.displayName || contact.givenName || 'Unknown',
            phone: phoneNumber,
          });
          
          if (newPerson) {
            newPeopleIds.push(newPerson.id);
          }
        }
        
        await loadData();
        setSelectedPeople([...selectedPeople, ...newPeopleIds]);
        setContactModalVisible(false);
        setSearchQuery('');
        setSelectedContacts([]);
      } catch (error) {
        Alert.alert('Error', 'Failed to add contacts');
      }
    } else {
      // Single mode
      const contact = selectedContacts[0];
      setName(contact.displayName || contact.givenName || '');
      const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0
        ? contact.phoneNumbers[0].number
        : '';
      setPhone(phoneNumber);
      setContactModalVisible(false);
      setSearchQuery('');
      setSelectedContacts([]);
    }
  };    const getFilteredContacts = () => {
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

    const handleAddPerson = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        try {
            const newPerson = await addPerson({
                name: name.trim(),
                phone: phone.trim(),
            });

            // Navigate directly to SinglePersonScreen
            navigation.replace('SinglePerson', {person: newPerson});
        } catch (error) {
            Alert.alert('Error', 'Failed to add person');
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }
        if (selectedPeople.length < 2) {
            Alert.alert('Error', 'Please select at least 2 members');
            return;
        }

        try {
            await addGroup({
                name: groupName.trim(),
                memberIds: selectedPeople,
            });
            
            Alert.alert('Success', 'Group created successfully', [
                {text: 'OK', onPress: () => navigation.goBack()},
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create group');
        }
    };

    const renderPerson = ({item}) => {
        const isSelected = selectedPeople.includes(item.id);
        return (
            <TouchableOpacity
                style={[styles.personItem, isSelected && styles.personItemSelected]}
                onPress={() => togglePersonSelection(item.id)}>
                <View style={styles.personLeft}>
                    <Icon
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isSelected ? APP_COLORS.primary : APP_COLORS.textSecondary}
                    />
                    <View style={styles.personTextContainer}>
                        <Text style={styles.personName}>{item.name}</Text>
                        {item.phone ? (
                            <Text style={styles.personPhone}>{item.phone}</Text>
                        ) : null}
                    </View>
                </View>
                <Icon name="person-circle" size={32} color={APP_COLORS.primary} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="close" size={24} color={APP_COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {selectionMode === 'single' ? 'Add Person' : 'Create Group'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {selectionMode === 'single' ? (
                    /* Single Person UI */
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Icon name="person-add" size={60} color={APP_COLORS.primary} />
                        </View>

                        <TouchableOpacity style={styles.contactButton} onPress={handlePickContact}>
                            <Icon name="book" size={20} color={APP_COLORS.primary} />
                            <Text style={styles.contactButtonText}>Pick from Contacts</Text>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Text style={styles.inputLabel}>Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter name"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />

                        <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />

                        <TouchableOpacity style={styles.button} onPress={handleAddPerson}>
                            <Text style={styles.buttonText}>Add Person</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Group Creation UI */
                    <>
                        {/* Group Name Input */}
                        <View style={styles.groupInputContainer}>
                            <Icon name="people" size={40} color={APP_COLORS.primary} />
                            <TextInput
                                style={styles.groupNameInput}
                                placeholder="Group Name"
                                value={groupName}
                                onChangeText={setGroupName}
                                autoFocus
                            />
                        </View>

                        {/* Selected Count */}
                        <View style={styles.selectedHeader}>
                            <Text style={styles.selectedText}>
                                {selectedPeople.length} member{selectedPeople.length !== 1 ? 's' : ''} selected
                            </Text>
                            <TouchableOpacity
                                onPress={handlePickContact}
                                style={styles.addContactButton}>
                                <Icon name="book" size={18} color={APP_COLORS.primary} />
                                <Text style={styles.addPersonText}>Add from Contacts</Text>
                            </TouchableOpacity>
                        </View>

                        {/* People List */}
                        {people.length > 0 ? (
                            <FlatList
                                data={people}
                                renderItem={renderPerson}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.listContainer}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Icon name="person-add-outline" size={60} color={APP_COLORS.textSecondary} />
                                <Text style={styles.emptyText}>No people added yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Add people from contacts to create a group
                                </Text>
                            </View>
                        )}

                        {/* Create Button */}
                        {people.length > 0 && (
                            <TouchableOpacity
                                style={[
                                    styles.createButton,
                                    selectedPeople.length < 2 && styles.createButtonDisabled,
                                ]}
                                onPress={handleCreateGroup}
                                disabled={selectedPeople.length < 2}>
                                <Text style={styles.createButtonText}>Create Group</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </KeyboardAvoidingView>

            {/* Contact Picker Modal */}
            <Modal
                visible={contactModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setContactModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer} edges={['top']}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                            <Icon name="close" size={24} color={APP_COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {selectionMode === 'single' ? 'Select Contact' : 'Select Multiple Contacts'}
                        </Text>
                        {selectionMode === 'group' && selectedContacts.length > 0 ? (
                            <TouchableOpacity onPress={handleDoneSelection}>
                                <Text style={styles.doneText}>Done ({selectedContacts.length})</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 50 }} />
                        )}
                    </View>

                    {/* Mode Toggle */}
                    <View style={styles.modeToggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                selectionMode === 'single' && styles.modeButtonActive
                            ]}
                            onPress={() => {
                                setSelectionMode('single');
                                setSelectedContacts([]);
                            }}
                        >
                            <Icon 
                                name="person" 
                                size={20} 
                                color={selectionMode === 'single' ? '#fff' : APP_COLORS.primary} 
                            />
                            <Text style={[
                                styles.modeButtonText,
                                selectionMode === 'single' && styles.modeButtonTextActive
                            ]}>
                                Single
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                selectionMode === 'group' && styles.modeButtonActive
                            ]}
                            onPress={() => {
                                setSelectionMode('group');
                                setSelectedContacts([]);
                            }}
                        >
                            <Icon 
                                name="people" 
                                size={20} 
                                color={selectionMode === 'group' ? '#fff' : APP_COLORS.primary} 
                            />
                            <Text style={[
                                styles.modeButtonText,
                                selectionMode === 'group' && styles.modeButtonTextActive
                            ]}>
                                Group
                            </Text>
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
                        renderItem={({ item }) => {
                            const phoneNumber = item.phoneNumbers && item.phoneNumbers.length > 0
                                ? item.phoneNumbers[0].number
                                : 'No phone';
                            
                            const isSelected = selectedContacts.some(c => c.recordID === item.recordID);

                            return (
                                <TouchableOpacity
                                    style={styles.contactItem}
                                    onPress={() => handleSelectContact(item)}>
                                    <View style={styles.contactLeft}>
                                        <Icon name="person-circle" size={40} color={APP_COLORS.primary} />
                                        <View style={styles.contactTextContainer}>
                                            <Text style={styles.contactName}>
                                                {item.displayName || item.givenName || 'Unknown'}
                                            </Text>
                                            <Text style={styles.contactPhone}>{phoneNumber}</Text>
                                        </View>
                                    </View>
                                    {selectionMode === 'group' ? (
                                        <View style={[
                                            styles.checkbox,
                                            isSelected && styles.checkboxSelected
                                        ]}>
                                            {isSelected && <Icon name="checkmark" size={18} color="#fff" />}
                                        </View>
                                    ) : (
                                        <Icon name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
                                    )}
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
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 32,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: APP_COLORS.cardBackground,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: APP_COLORS.primary,
        marginBottom: 16,
    },
    contactButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: APP_COLORS.primary,
        marginLeft: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        fontSize: 13,
        color: APP_COLORS.textSecondary,
        marginHorizontal: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: APP_COLORS.text,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: APP_COLORS.cardBackground,
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: APP_COLORS.text,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    button: {
        backgroundColor: APP_COLORS.primary,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 32,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: APP_COLORS.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: APP_COLORS.text,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
    doneText: {
        fontSize: 16,
        fontWeight: '600',
        color: APP_COLORS.primary,
    },
    modeToggleContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: APP_COLORS.primary,
        backgroundColor: APP_COLORS.cardBackground,
        gap: 6,
    },
    modeButtonActive: {
        backgroundColor: APP_COLORS.primary,
    },
    modeButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: APP_COLORS.primary,
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: APP_COLORS.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: APP_COLORS.primary,
        borderColor: APP_COLORS.primary,
    },
    groupInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: APP_COLORS.cardBackground,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    groupNameInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
        color: APP_COLORS.text,
        marginLeft: 16,
    },
    selectedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: APP_COLORS.cardBackground,
    },
    selectedText: {
        fontSize: 14,
        fontWeight: '500',
        color: APP_COLORS.textSecondary,
    },
    addContactButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addPersonText: {
        fontSize: 14,
        fontWeight: '500',
        color: APP_COLORS.primary,
        marginLeft: 4,
    },
    listContainer: {
        paddingVertical: 8,
    },
    personItem: {
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
    personItemSelected: {
        borderColor: APP_COLORS.primary,
        backgroundColor: `${APP_COLORS.primary}10`,
    },
    personLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    personTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    personName: {
        fontSize: 15,
        fontWeight: '500',
        color: APP_COLORS.text,
    },
    personPhone: {
        fontSize: 13,
        color: APP_COLORS.textSecondary,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 16,
        color: APP_COLORS.textSecondary,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: APP_COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    createButton: {
        backgroundColor: APP_COLORS.primary,
        paddingVertical: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: APP_COLORS.textSecondary,
        opacity: 0.5,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddPersonScreen;
