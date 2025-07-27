import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CalendarDatePickerProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  maxDate?: string; // Can't select dates after this
  minDate?: string; // Can't select dates before this
}

export function CalendarDatePicker({
  selectedDate,
  onDateChange,
  placeholder = 'Select date',
  label,
  maxDate,
  minDate
}: CalendarDatePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });

  const today = new Date();
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

  // Format date for display
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get days in month
  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days: (Date | null)[] = [];
    
    // Add days from previous month (empty slots)
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    // Fill rest of week
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    
    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (maxDate && dateStr > maxDate) return true;
    if (minDate && dateStr < minDate) return true;
    
    return false;
  };

  const isToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDateObj) return false;
    return date.toDateString() === selectedDateObj.toDateString();
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    const dateString = date.toISOString().split('T')[0];
    onDateChange(dateString);
    setShowCalendar(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    dateSelector: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.background,
    },
    dateText: {
      fontSize: 16,
      color: selectedDate ? colors.text : colors.tabIconDefault,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    calendarContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      margin: 20,
      width: '90%',
      maxWidth: 350,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    navButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.tabIconDefault + '20',
    },
    navButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    monthText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    dayNamesRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    dayNameCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    dayNameText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.tabIconDefault,
    },
    calendarGrid: {
      marginBottom: 20,
    },
    weekRow: {
      flexDirection: 'row',
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 1,
    },
    dayButton: {
      width: '90%',
      height: '90%',
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    todayButton: {
      backgroundColor: colors.tint + '30',
    },
    todayText: {
      color: colors.tint,
      fontWeight: '700',
    },
    selectedButton: {
      backgroundColor: colors.tint,
    },
    selectedText: {
      color: 'white',
      fontWeight: '700',
    },
    disabledButton: {
      opacity: 0.3,
    },
    disabledText: {
      color: colors.tabIconDefault,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    cancelButton: {
      backgroundColor: colors.tabIconDefault + '20',
    },
    confirmButton: {
      backgroundColor: colors.tint,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const days = getDaysInMonth(currentMonth);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Pressable
        style={styles.dateSelector}
        onPress={() => setShowCalendar(true)}
      >
        <Text style={styles.dateText}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </Text>
      </Pressable>

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <Pressable
                style={styles.navButton}
                onPress={() => navigateMonth('prev')}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </Pressable>
              
              <Text style={styles.monthText}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              
              <Pressable
                style={styles.navButton}
                onPress={() => navigateMonth('next')}
              >
                <Text style={styles.navButtonText}>›</Text>
              </Pressable>
            </View>

            {/* Day Names */}
            <View style={styles.dayNamesRow}>
              {dayNames.map((dayName) => (
                <View key={dayName} style={styles.dayNameCell}>
                  <Text style={styles.dayNameText}>{dayName}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {week.map((date, dayIndex) => (
                    <View key={dayIndex} style={styles.dayCell}>
                      {date && (
                        <Pressable
                          style={[
                            styles.dayButton,
                            isToday(date) && styles.todayButton,
                            isSelected(date) && styles.selectedButton,
                            isDateDisabled(date) && styles.disabledButton,
                          ]}
                          onPress={() => handleDateSelect(date)}
                          disabled={isDateDisabled(date)}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isToday(date) && styles.todayText,
                              isSelected(date) && styles.selectedText,
                              isDateDisabled(date) && styles.disabledText,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}