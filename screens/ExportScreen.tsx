import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Button, Card, Text, Checkbox, Divider, List, useTheme, Surface, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateAndSharePDF } from './utils/PDFGenerator';

export default function ExportScreen({ navigation }) {
  const theme = useTheme();
  // In a real app, this data would come from your database or state management
  const [timeEntries, setTimeEntries] = useState([
    {
      id: '1',
      description: 'Website Development',
      duration: 7200000, // 2 hours in milliseconds
      timestamp: new Date('2025-03-29T10:00:00').toISOString(),
      customer: 'Acme Inc.',
      type: 'manual'
    },
    {
      id: '2',
      description: 'Server Maintenance',
      duration: 5400000, // 1.5 hours in milliseconds
      timestamp: new Date('2025-03-28T14:30:00').toISOString(),
      customer: 'TechCorp',
      type: 'automatic'
    },
    {
      id: '3',
      description: 'Client Meeting',
      duration: 3600000, // 1 hour in milliseconds
      timestamp: new Date('2025-03-27T09:00:00').toISOString(),
      customer: 'Acme Inc.',
      type: 'manual'
    }
  ]);

  const [selectedEntries, setSelectedEntries] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month'

  // Load customers from AsyncStorage
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customersFromStorage = await AsyncStorage.getItem('customers');
        if (customersFromStorage) {
          setCustomers(JSON.parse(customersFromStorage));
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    
    loadCustomers();
    
    // Add a focus listener to reload customers when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadCustomers);
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);

  // Get unique customer names from time entries
  const customerNames = [...new Set(timeEntries.map(entry => entry.customer))];
  
  // Filter entries by date range
  const getFilteredEntries = () => {
    if (dateFilter === 'all') {
      return timeEntries;
    }
    
    const now = new Date();
    const pastDate = new Date();
    
    if (dateFilter === 'week') {
      pastDate.setDate(now.getDate() - 7); // Past week
    } else if (dateFilter === 'month') {
      pastDate.setMonth(now.getMonth() - 1); // Past month
    }
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= pastDate && entryDate <= now;
    });
  };
  
  const filteredTimeEntries = getFilteredEntries();

  const toggleEntrySelection = (id) => {
    setSelectedEntries({
      ...selectedEntries,
      [id]: !selectedEntries[id]
    });
  };

  const selectAllEntries = () => {
    const allSelected = {};
    timeEntries
      .filter(entry => !selectedCustomer || entry.customer === selectedCustomer)
      .forEach(entry => {
        allSelected[entry.id] = true;
      });
    setSelectedEntries(allSelected);
  };

  const deselectAllEntries = () => {
    setSelectedEntries({});
  };

  const filterByCustomer = (customer) => {
    if (selectedCustomer === customer) {
      setSelectedCustomer(null);
    } else {
      setSelectedCustomer(customer);
      // Clear current selections
      setSelectedEntries({});
    }
  };

  // Load time entries from AsyncStorage
  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        const entriesFromStorage = await AsyncStorage.getItem('timeEntries');
        if (entriesFromStorage) {
          setTimeEntries(JSON.parse(entriesFromStorage));
        }
      } catch (error) {
        console.error('Failed to load time entries:', error);
      }
    };
    
    loadTimeEntries();
    
    // Add a focus listener to reload time entries when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadTimeEntries);
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  const getTotalTime = () => {
    return timeEntries
      .filter(entry => selectedEntries[entry.id])
      .reduce((total, entry) => total + entry.duration, 0);
  };


  const exportToPDF = async () => {
    try {
      // Get selected time entries
      const selectedTimeEntries = timeEntries.filter(entry => selectedEntries[entry.id]);
      
      if (selectedTimeEntries.length === 0) {
        Alert.alert('No Entries Selected', 'Please select at least one time entry to export.');
        return;
      }
      
      // Get date range text
      let dateRangeText = "All Time";
      if (dateFilter === 'week') {
        const pastWeek = new Date();
        pastWeek.setDate(pastWeek.getDate() - 7);
        dateRangeText = `Past Week (${pastWeek.toLocaleDateString()} - ${new Date().toLocaleDateString()})`;
      } else if (dateFilter === 'month') {
        const pastMonth = new Date();
        pastMonth.setMonth(pastMonth.getMonth() - 1);
        dateRangeText = `Past Month (${pastMonth.toLocaleDateString()} - ${new Date().toLocaleDateString()})`;
      }
      
      // Use the PDFGenerator to generate and share the PDF
      await generateAndSharePDF(selectedTimeEntries, dateRangeText, formatTime);
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      Alert.alert('Export Error', `An error occurred: ${error.message}`);
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.card} mode="elevated">
          <Card.Title title="Export Time Records" titleStyle={styles.cardTitle} />
          <Card.Content>
            <Surface style={styles.infoSurface} elevation={1}>
              <Text variant="bodyMedium" style={styles.description}>
                Select time entries to include in your export
              </Text>
            </Surface>
            
            <View style={styles.dateFilterContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Time Period:</Text>
              <SegmentedButtons
                value={dateFilter}
                onValueChange={setDateFilter}
                buttons={[
                  { value: 'all', label: 'All Time' },
                  { value: 'week', label: 'Past Week' },
                  { value: 'month', label: 'Past Month' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
            
            <View style={styles.filterContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Filter by Customer:</Text>
              <View style={styles.customerFilters}>
                {customerNames.map(customer => (
                  <Button 
                    key={customer}
                    mode={selectedCustomer === customer ? "contained" : "outlined"}
                    onPress={() => filterByCustomer(customer)}
                    style={styles.filterButton}
                    contentStyle={styles.filterButtonContent}
                  >
                    {customer}
                  </Button>
                ))}
              </View>
            </View>
            
            <View style={styles.selectionButtons}>
              <Button 
                mode="outlined" 
                onPress={selectAllEntries}
                style={styles.selectionButton}
                icon="checkbox-multiple-marked"
              >
                Select All
              </Button>
              <Button 
                mode="outlined" 
                onPress={deselectAllEntries}
                style={styles.selectionButton}
                icon="checkbox-multiple-blank-outline"
              >
                Deselect All
              </Button>
            </View>
            
            <Divider style={styles.divider} />
            
            <Surface style={styles.entriesSurface} elevation={1}>
              {filteredTimeEntries
                .filter(entry => !selectedCustomer || entry.customer === selectedCustomer)
                .map((entry, index, filteredArray) => (
                  <View key={entry.id} style={styles.entryItem}>
                    <List.Item
                      title={entry.description}
                      titleStyle={styles.entryTitle}
                      description={`${new Date(entry.timestamp).toLocaleDateString()} - ${entry.customer}`}
                      descriptionStyle={styles.entryDescription}
                      left={props => (
                        <Checkbox
                          status={selectedEntries[entry.id] ? 'checked' : 'unchecked'}
                          onPress={() => toggleEntrySelection(entry.id)}
                          color={theme.colors.primary}
                        />
                      )}
                      right={props => (
                        <View style={styles.durationContainer}>
                          <Text style={styles.durationText}>{formatTime(entry.duration)}</Text>
                        </View>
                      )}
                    />
                    {index < filteredArray.length - 1 && <Divider style={styles.entryDivider} />}
                  </View>
                ))}
                
                {filteredTimeEntries
                  .filter(entry => !selectedCustomer || entry.customer === selectedCustomer)
                  .length === 0 && (
                    <Text style={styles.emptyMessage}>No entries match the selected filters</Text>
                  )
                }
            </Surface>
            
            <Surface style={styles.totalSurface} elevation={2}>
              <Text variant="titleMedium" style={styles.totalLabel}>Total Selected Time:</Text>
              <Text variant="headlineMedium" style={styles.totalValue}>{formatTime(getTotalTime())}</Text>
            </Surface>
            
            <Button 
              mode="contained" 
              onPress={exportToPDF} 
              style={styles.exportButton}
              contentStyle={styles.exportButtonContent}
              icon="file-pdf-box"
              disabled={Object.keys(selectedEntries).length === 0}
              key="export-pdf-button"
            >
              Generate PDF Report
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 16 : 80, // Extra padding for bottom tabs on mobile
  },
  card: {
    elevation: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSurface: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    marginBottom: 16,
  },
  description: {
    color: '#0d47a1',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateFilterContainer: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  customerFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  filterButton: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
  },
  filterButtonContent: {
    paddingHorizontal: 12,
  },
  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectionButton: {
    flex: 0.48,
    borderRadius: 4,
  },
  divider: {
    marginVertical: 16,
    height: 1,
  },
  entriesSurface: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  entryItem: {
    backgroundColor: 'white',
  },
  entryTitle: {
    fontWeight: 'bold',
  },
  entryDescription: {
    fontSize: 12,
    color: '#666',
  },
  entryDivider: {
    height: 1,
  },
  durationContainer: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 4,
    justifyContent: 'center',
  },
  durationText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  totalSurface: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    marginVertical: 16,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#2e7d32',
    marginBottom: 4,
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  exportButton: {
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  exportButtonContent: {
    paddingVertical: 8,
  },
  emptyMessage: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    color: '#888',
  },
});
