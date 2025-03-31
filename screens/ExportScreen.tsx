import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Button, Card, Text, Checkbox, Divider, List, useTheme, Surface, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const generateHTML = () => {
    const selectedTimeEntries = timeEntries.filter(entry => selectedEntries[entry.id]);
    
    if (selectedTimeEntries.length === 0) {
      return '<h1>No entries selected</h1>';
    }

    const totalTime = getTotalTime();
    const formattedTotalTime = formatTime(totalTime);
    
    // Group entries by customer
    const entriesByCustomer = {};
    selectedTimeEntries.forEach(entry => {
      if (!entriesByCustomer[entry.customer]) {
        entriesByCustomer[entry.customer] = [];
      }
      entriesByCustomer[entry.customer].push(entry);
    });

    // Group entries by description within each customer
    const entriesByCustomerAndDescription = {};
    Object.keys(entriesByCustomer).forEach(customer => {
      entriesByCustomerAndDescription[customer] = {};
      
      entriesByCustomer[customer].forEach(entry => {
        if (!entriesByCustomerAndDescription[customer][entry.description]) {
          entriesByCustomerAndDescription[customer][entry.description] = [];
        }
        entriesByCustomerAndDescription[customer][entry.description].push(entry);
      });
    });

    // Get date range for report title
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

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Time Tracking Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            
            body { 
              font-family: 'Roboto', sans-serif; 
              margin: 0;
              padding: 0;
              color: #333;
              background-color: #fff;
            }
            
            .container {
              max-width: 1000px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #2196F3;
            }
            
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #2196F3;
              margin-bottom: 10px;
            }
            
            h1 {
              font-size: 24px;
              font-weight: 500;
              color: #333;
              margin: 10px 0;
            }
            
            .date-generated {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
            }
            
            .date-range {
              font-size: 16px;
              font-weight: 500;
              color: #2196F3;
              margin: 10px 0 30px 0;
            }
            
            .customer-section {
              margin-bottom: 40px;
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .customer-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .customer-name {
              font-size: 20px;
              font-weight: 500;
              color: #333;
            }
            
            .customer-total {
              font-size: 18px;
              font-weight: 500;
              color: #2196F3;
            }
            
            .description-section {
              margin-bottom: 20px;
              background-color: #fff;
              border-radius: 6px;
              padding: 15px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            
            .description-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #eee;
            }
            
            .description-title {
              font-size: 16px;
              font-weight: 500;
              color: #555;
            }
            
            .description-total {
              font-size: 16px;
              font-weight: 500;
              color: #4CAF50;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 14px;
            }
            
            th {
              background-color: #f5f5f5;
              text-align: left;
              padding: 10px;
              font-weight: 500;
              color: #555;
              border-bottom: 2px solid #e0e0e0;
            }
            
            td {
              padding: 10px;
              border-bottom: 1px solid #eee;
              color: #666;
            }
            
            tr:last-child td {
              border-bottom: none;
            }
            
            .summary-section {
              margin-top: 40px;
              background-color: #e8f5e9;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
            }
            
            .summary-title {
              font-size: 18px;
              font-weight: 500;
              color: #2E7D32;
              margin-bottom: 10px;
            }
            
            .summary-total {
              font-size: 24px;
              font-weight: 700;
              color: #2E7D32;
            }
            
            .footer {
              margin-top: 60px;
              text-align: center;
              color: #9e9e9e;
              font-size: 12px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Time Account App</div>
              <h1>Time Tracking Report</h1>
              <div class="date-generated">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
              <div class="date-range">${dateRangeText}</div>
            </div>
    `;

    // Add customer sections
    Object.keys(entriesByCustomerAndDescription).forEach(customer => {
      const customerEntries = entriesByCustomer[customer];
      const customerTotal = customerEntries.reduce((total, entry) => total + entry.duration, 0);
      
      html += `
        <div class="customer-section">
          <div class="customer-header">
            <div class="customer-name">${customer}</div>
            <div class="customer-total">Total: ${formatTime(customerTotal)}</div>
          </div>
      `;
      
      // Add description sections within each customer
      Object.keys(entriesByCustomerAndDescription[customer]).forEach(description => {
        const descriptionEntries = entriesByCustomerAndDescription[customer][description];
        const descriptionTotal = descriptionEntries.reduce((total, entry) => total + entry.duration, 0);
        
        html += `
          <div class="description-section">
            <div class="description-header">
              <div class="description-title">${description}</div>
              <div class="description-total">Total: ${formatTime(descriptionTotal)}</div>
            </div>
            
            <table>
              <tr>
                <th>Date</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Type</th>
              </tr>
        `;
        
        descriptionEntries.forEach(entry => {
          const entryDate = new Date(entry.timestamp);
          const formattedDate = entryDate.toLocaleDateString();
          const formattedTime = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          html += `
            <tr>
              <td>${formattedDate}</td>
              <td>${formattedTime}</td>
              <td>${formatTime(entry.duration)}</td>
              <td>${entry.type === 'manual' ? 'Manual Entry' : 'Timer'}</td>
            </tr>
          `;
        });
        
        html += `
            </table>
          </div>
        `;
      });
      
      html += `
        </div>
      `;
    });

    html += `
            <div class="summary-section">
              <div class="summary-title">Total Time</div>
              <div class="summary-total">${formattedTotalTime}</div>
            </div>
            
            <div class="footer">
              <p>This report was generated by Time Account App. All times are displayed in hours and minutes.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const exportToPDF = async () => {
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        alert('Sharing is not available on your platform');
      }
    } catch (error) {
      alert('An error occurred: ' + error.message);
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
            >
              Export to PDF
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
