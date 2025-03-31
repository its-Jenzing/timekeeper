import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Button, Card, Text, Checkbox, Divider, List, useTheme, Surface, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
      
      // Show loading indicator without using Alert which blocks the UI
      // and might be causing the screenshot issue
      console.log('Generating PDF report...');
      
      // Generate HTML for the PDF
      const html = generateReportHTML(selectedTimeEntries, dateRangeText);
      
      // Use printToFileAsync with explicit options to ensure proper PDF generation
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612, // Standard US Letter width in points (8.5 inches)
        height: 792, // Standard US Letter height in points (11 inches),
        // Ensure we're not capturing the screen but generating a PDF from HTML
        printerUrl: 'pdf',
      });
      
      console.log('PDF generated at:', uri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Time Tracking Report',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Sharing Not Available', 'Sharing is not available on your platform');
      }
    } catch (error) {
      Alert.alert('Export Error', `An error occurred: ${error.message}`);
      console.error('PDF Export Error:', error);
    }
  };
  
  // Generate HTML for the PDF report
  const generateReportHTML = (selectedTimeEntries, dateRangeText) => {
    if (selectedTimeEntries.length === 0) {
      return '<h1>No entries selected</h1>';
    }

    // Calculate total time
    const totalTime = selectedTimeEntries.reduce((total, entry) => total + entry.duration, 0);
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

    // Calculate total hours per customer for pie chart data
    const customerTotals = {};
    Object.keys(entriesByCustomer).forEach(customer => {
      const customerTotal = entriesByCustomer[customer].reduce((total, entry) => total + entry.duration, 0);
      customerTotals[customer] = customerTotal;
    });

    // Generate random colors for the pie chart
    const generateRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    // Create pie chart data
    const pieChartColors = {};
    Object.keys(customerTotals).forEach(customer => {
      pieChartColors[customer] = generateRandomColor();
    });

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Time Tracking Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body { 
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              line-height: 1.6;
              color: #333;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .container {
              max-width: 1000px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            
            .header {
              position: relative;
              margin-bottom: 40px;
            }
            
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 3px solid #f3f4f6;
            }
            
            .header-left {
              flex: 1;
            }
            
            .header-right {
              text-align: right;
              flex: 1;
            }
            
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #4f46e5;
              letter-spacing: -0.5px;
            }
            
            .report-title {
              font-size: 36px;
              font-weight: 800;
              color: #111827;
              margin: 20px 0 15px 0;
              letter-spacing: -1px;
            }
            
            .date-generated {
              font-size: 14px;
              color: #6b7280;
              margin-top: 5px;
            }
            
            .date-range {
              display: inline-block;
              font-size: 15px;
              font-weight: 600;
              color: #4f46e5;
              margin: 15px 0;
              padding: 8px 16px;
              background-color: #eef2ff;
              border-radius: 30px;
            }
            
            .summary-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            
            .summary-card {
              flex: 1;
              background: linear-gradient(135deg, #4f46e5, #6366f1);
              color: white;
              padding: 25px;
              border-radius: 16px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              max-width: 300px;
            }
            
            .summary-title {
              font-size: 16px;
              font-weight: 500;
              opacity: 0.9;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .summary-total {
              font-size: 36px;
              font-weight: 700;
              margin-top: 10px;
            }
            
            .chart-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              background-color: white;
              border-radius: 16px;
              padding: 25px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border: 1px solid #f3f4f6;
            }
            
            .pie-chart {
              width: 200px;
              height: 200px;
              position: relative;
              border-radius: 50%;
              overflow: hidden;
              background: conic-gradient(
                ${Object.keys(customerTotals).map((customer, index, array) => {
                  const percentage = (customerTotals[customer] / totalTime) * 100;
                  const previousPercentages = array.slice(0, index).reduce((acc, curr) => {
                    return acc + (customerTotals[curr] / totalTime) * 100;
                  }, 0);
                  return `${pieChartColors[customer]} ${previousPercentages}% ${previousPercentages + percentage}%`;
                }).join(', ')}
              );
              margin: 0 auto;
            }
            
            .chart-legend {
              flex: 1;
              margin-left: 30px;
            }
            
            .legend-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              color: #111827;
            }
            
            .legend-items {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            
            .legend-item {
              display: flex;
              align-items: center;
            }
            
            .legend-color {
              width: 16px;
              height: 16px;
              border-radius: 4px;
              margin-right: 10px;
            }
            
            .legend-label {
              font-size: 14px;
              color: #4b5563;
            }
            
            .legend-value {
              margin-left: auto;
              font-weight: 600;
              color: #111827;
            }
            
            .customer-section {
              margin-bottom: 40px;
              background-color: white;
              border-radius: 16px;
              padding: 30px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border: 1px solid #f3f4f6;
            }
            
            .customer-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #f3f4f6;
            }
            
            .customer-name {
              font-size: 24px;
              font-weight: 700;
              color: #111827;
            }
            
            .customer-total {
              font-size: 18px;
              font-weight: 600;
              color: #4f46e5;
              background-color: #eef2ff;
              padding: 8px 16px;
              border-radius: 12px;
            }
            
            .description-section {
              margin-bottom: 25px;
              background-color: #f9fafb;
              border-radius: 12px;
              padding: 20px;
              border: 1px solid #f3f4f6;
            }
            
            .description-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .description-title {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
            }
            
            .description-total {
              font-size: 16px;
              font-weight: 600;
              color: #059669;
              background-color: #ecfdf5;
              padding: 6px 12px;
              border-radius: 8px;
            }
            
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 10px;
              font-size: 14px;
            }
            
            th {
              background-color: #f3f4f6;
              text-align: left;
              padding: 12px 15px;
              font-weight: 600;
              color: #4b5563;
              border-bottom: 1px solid #e5e7eb;
              border-top: 1px solid #e5e7eb;
            }
            
            th:first-child {
              border-left: 1px solid #e5e7eb;
              border-top-left-radius: 8px;
            }
            
            th:last-child {
              border-right: 1px solid #e5e7eb;
              border-top-right-radius: 8px;
            }
            
            td {
              padding: 12px 15px;
              border-bottom: 1px solid #e5e7eb;
              color: #4b5563;
            }
            
            td:first-child {
              border-left: 1px solid #e5e7eb;
            }
            
            td:last-child {
              border-right: 1px solid #e5e7eb;
            }
            
            tr:last-child td:first-child {
              border-bottom-left-radius: 8px;
            }
            
            tr:last-child td:last-child {
              border-bottom-right-radius: 8px;
            }
            
            .time-cell {
              font-weight: 500;
              color: #4f46e5;
            }
            
            .type-cell {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .type-manual {
              background-color: #eef2ff;
              color: #4f46e5;
            }
            
            .type-automatic {
              background-color: #f0fdf4;
              color: #059669;
            }
            
            .total-summary {
              margin-top: 50px;
              background-color: #f0fdf4;
              border-radius: 16px;
              padding: 30px;
              text-align: center;
              border: 1px solid #d1fae5;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .total-summary-title {
              font-size: 20px;
              font-weight: 600;
              color: #059669;
              margin-bottom: 15px;
            }
            
            .total-summary-value {
              font-size: 36px;
              font-weight: 700;
              color: #059669;
            }
            
            .footer {
              margin-top: 60px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            @media print {
              body {
                font-size: 12pt;
              }
              
              .container {
                padding: 0;
                max-width: 100%;
              }
              
              .customer-section {
                page-break-inside: avoid;
              }
              
              .description-section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-top">
                <div class="header-left">
                  <div class="logo">Time Account App</div>
                  <div class="date-range">${dateRangeText}</div>
                </div>
                <div class="header-right">
                  <div class="date-generated">Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
                </div>
              </div>
              <h1 class="report-title">Time Tracking Report</h1>
            </div>
            
            <div class="summary-section">
              <div class="summary-card">
                <div class="summary-title">Total Hours</div>
                <div class="summary-total">${formattedTotalTime}</div>
              </div>
            </div>
            
            <div class="chart-container">
              <div class="pie-chart"></div>
              <div class="chart-legend">
                <h3 class="legend-title">Time Distribution by Customer</h3>
                <div class="legend-items">
                  ${Object.keys(customerTotals).map(customer => {
                    const percentage = ((customerTotals[customer] / totalTime) * 100).toFixed(1);
                    return `
                      <div class="legend-item">
                        <div class="legend-color" style="background-color: ${pieChartColors[customer]}"></div>
                        <div class="legend-label">${customer}</div>
                        <div class="legend-value">${formatTime(customerTotals[customer])} (${percentage}%)</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
    `;

    // Add customer sections
    Object.keys(entriesByCustomerAndDescription).forEach((customer, customerIndex) => {
      const customerEntries = entriesByCustomer[customer];
      const customerTotal = customerEntries.reduce((total, entry) => total + entry.duration, 0);
      const customerColor = pieChartColors[customer];
      
      html += `
        <div class="customer-section">
          <div class="customer-header">
            <div class="customer-name">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: ${customerColor}; margin-right: 8px; border-radius: 2px;"></span>
              ${customer}
            </div>
            <div class="customer-total">Total: ${formatTime(customerTotal)}</div>
          </div>
      `;
      
      // Add description sections within each customer
      Object.keys(entriesByCustomerAndDescription[customer]).forEach((description, descIndex) => {
        const descriptionEntries = entriesByCustomerAndDescription[customer][description];
        const descriptionTotal = descriptionEntries.reduce((total, entry) => total + entry.duration, 0);
        const percentOfCustomer = ((descriptionTotal / customerTotal) * 100).toFixed(1);
        
        html += `
          <div class="description-section">
            <div class="description-header">
              <div class="description-title">${description}</div>
              <div class="description-total">Total: ${formatTime(descriptionTotal)} (${percentOfCustomer}%)</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        // Sort entries by date (newest first)
        const sortedEntries = [...descriptionEntries].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        sortedEntries.forEach(entry => {
          const entryDate = new Date(entry.timestamp);
          const formattedDate = entryDate.toLocaleDateString();
          const formattedTime = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const entryType = entry.type === 'manual' ? 'Manual Entry' : 'Timer';
          const typeClass = entry.type === 'manual' ? 'type-manual' : 'type-automatic';
          
          html += `
            <tr>
              <td>${formattedDate}</td>
              <td>${formattedTime}</td>
              <td class="time-cell">${formatTime(entry.duration)}</td>
              <td><span class="type-cell ${typeClass}">${entryType}</span></td>
            </tr>
          `;
        });
        
        html += `
              </tbody>
            </table>
          </div>
        `;
      });
      
      html += `
        </div>
        ${customerIndex < Object.keys(entriesByCustomerAndDescription).length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });

    html += `
            <div class="total-summary">
              <div class="total-summary-title">Total Time Tracked</div>
              <div class="total-summary-value">${formattedTotalTime}</div>
            </div>
            
            <div class="footer">
              <p>This report was generated by Time Account App. All times are displayed in hours and minutes.</p>
              <p>© ${new Date().getFullYear()} Time Account App</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
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
              // Add a key to ensure the component is properly re-rendered
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
