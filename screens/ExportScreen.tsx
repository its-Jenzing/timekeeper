import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, Card, Text, Checkbox, Divider, List, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ExportScreen({ navigation }) {
  const theme = useTheme();
  // In a real app, this data would come from your database or state management
  const [timeEntries] = useState([
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

  const customers = [...new Set(timeEntries.map(entry => entry.customer))];

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

    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2c3e50; }
            h2 { color: #3498db; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f2f2f2; text-align: left; padding: 12px; }
            td { padding: 12px; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 50px; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Time Tracking Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    `;

    // Add customer sections
    Object.keys(entriesByCustomer).forEach(customer => {
      const entries = entriesByCustomer[customer];
      const customerTotal = entries.reduce((total, entry) => total + entry.duration, 0);
      
      html += `
        <h2>Customer: ${customer}</h2>
        <table>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Duration</th>
          </tr>
      `;
      
      entries.forEach(entry => {
        html += `
          <tr>
            <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
            <td>${entry.description}</td>
            <td>${formatTime(entry.duration)}</td>
          </tr>
        `;
      });
      
      html += `
        </table>
        <p class="total">Customer Total: ${formatTime(customerTotal)}</p>
      `;
    });

    html += `
          <h2>Summary</h2>
          <p class="total">Total Time: ${formattedTotalTime}</p>
          <div class="footer">
            <p>Generated by Time Account App</p>
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
            
            <View style={styles.filterContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Filter by Customer:</Text>
              <View style={styles.customerFilters}>
                {customers.map(customer => (
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
              {timeEntries
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
                
                {timeEntries
                  .filter(entry => !selectedCustomer || entry.customer === selectedCustomer)
                  .length === 0 && (
                    <Text style={styles.emptyMessage}>No entries match the selected filter</Text>
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
