import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDateContext} from '../context/DateContext';
import {APP_COLORS} from '../constants/expenseCategories';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MonthYearPicker = () => {
  const {selectedMonth, selectedYear, updateDate} = useDateContext();
  const [showPicker, setShowPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 20}, (_, i) => currentYear - i);

  const handleConfirm = () => {
    updateDate(tempMonth, tempYear);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setShowPicker(false);
  };

  const handleOpen = () => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={handleOpen}
        activeOpacity={0.7}>
        <Icon name="calendar-outline" size={14} color={APP_COLORS.primary} />
        <Text style={styles.selectorText}>
          {MONTHS[selectedMonth]} {selectedYear}
        </Text>
        <Icon name="chevron-down" size={14} color={APP_COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancel}>
          <View style={styles.modalWrapper}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle}>Select Month & Year</Text>

                {/* Year Selector */}
                <View style={styles.section}>
                  <Text style={styles.label}>Year</Text>
                  <ScrollView 
                    style={styles.yearScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}>
                    <View style={styles.yearGrid}>
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.yearItem,
                            tempYear === year && styles.yearItemActive,
                          ]}
                          onPress={() => setTempYear(year)}>
                          <Text
                            style={[
                              styles.yearText,
                              tempYear === year && styles.yearTextActive,
                            ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Month Selector */}
                <View style={styles.section}>
                  <Text style={styles.label}>Month</Text>
                  <View style={styles.monthGrid}>
                    {MONTHS.map((month, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.monthItem,
                          tempMonth === index && styles.monthItemActive,
                        ]}
                        onPress={() => setTempMonth(index)}>
                        <Text
                          style={[
                            styles.monthText,
                            tempMonth === index && styles.monthTextActive,
                          ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Removed margins to work better in header
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  selectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: APP_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 20,
  },
  pickerContainer: {
    backgroundColor: APP_COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginBottom: 12,
  },
  yearScrollView: {
    maxHeight: 160,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  yearItem: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  yearItemActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  yearText: {
    fontSize: 15,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  yearTextActive: {
    color: '#FFFFFF',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  monthItem: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  monthItemActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  monthTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: APP_COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },
  confirmButton: {
    backgroundColor: APP_COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MonthYearPicker;
