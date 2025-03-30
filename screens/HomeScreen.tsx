import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, FlatList, TouchableOpacity } from 'react-native';
import { Button, Card, Text, TextInput, FAB, Divider, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Load customers from AsyncStorage
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // In a real app with proper state management, this would be cleaner
        // For now, we'll use a simple approach to load customers
        const customersFromStorage = await AsyncStorage.getItem('customers');
        if (customersFromStorage) {
          setCustomers(JSON.parse(customersFromStorage));
        } else {
          // Fallback to default customers if none in storage
          const defaultCustomers = [
            { id: '1', name: 'Acme Inc.' },
            { id: '2', name: 'TechCorp' },
            { id: '3', name: 'GlobalSoft' }
          ];
          setCustomers(defaultCustomers);
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
        // Fallback to default customers on error
        const defaultCustomers = [
          { id: '1', name: 'Acme Inc.' },
          { id: '2', name: 'TechCorp' },
          { id: '3', name: 'GlobalSoft' }
        ];
        setCustomers(defaultCustomers);
      }
    };
    
    loadCustomers();
    
    // Add a focus listener to reload customers when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadCustomers);
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);

  // Filter customers based on search query
  useEffect(() => {
    if (customerQuery) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(customerQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  }, [customerQuery, customers]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const startTimer = () => {
    setStartTime(Date.now());
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    const entry = {
      id: Date.now().toString(),
      duration: elapsedTime,
      description: description || 'No description',
      timestamp: new Date().toISOString(),
      type: 'automatic',
      customer: selectedCustomer ? selectedCustomer.name : 'Unassigned'
    };
    setTimeEntries([entry, ...timeEntries]);
    setElapsedTime(0);
    setDescription('');
    setSelectedCustomer(null);
    setCustomerQuery('');
  };

  // Load time entries from AsyncStorage on initial render
  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        const savedEntries = await AsyncStorage.getItem('timeEntries');
        if (savedEntries) {
          setTimeEntries(JSON.parse(savedEntries));
        }
      } catch (error) {
        console.error('Failed to load time entries:', error);
      }
    };
    
    loadTimeEntries();
  }, []);

  // Save time entries to AsyncStorage whenever they change
  useEffect(() => {
    const saveTimeEntries = async () => {
      try {
        await AsyncStorage.setItem('timeEntries', JSON.stringify(timeEntries));
      } catch (error) {
        console.error('Failed to save time entries:', error);
      }
    };
    
    if (timeEntries.length > 0) {
      saveTimeEntries();
    }
  }, [timeEntries]);

  const addManualEntry = () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalMilliseconds = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    
    if (totalMilliseconds > 0) {
      const entry = {
        id: Date.now().toString(),
        duration: totalMilliseconds,
        description: description || 'No description',
        timestamp: new Date().toISOString(),
        type: 'manual',
        customer: selectedCustomer ? selectedCustomer.name : 'Unassigned'
      };
      setTimeEntries([entry, ...timeEntries]);
      setManualHours('');
      setManualMinutes('');
      setDescription('');
      setSelectedCustomer(null);
      setCustomerQuery('');
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.timerSection}>
          <Card style={styles.timerCard} mode="elevated">
            <Card.Title title="Stopwatch Timer" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.timerDisplay}>
                <Text variant="displaySmall" style={styles.timer}>
                  {formatTime(elapsedTime)}
                </Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input, styles.descriptionInput]}
                  mode="outlined"
                />
                <View style={styles.customerSelector}>
                  <TextInput
                    label="Customer"
                    value={selectedCustomer ? selectedCustomer.name : customerQuery}
                    onChangeText={(text) => {
                      setCustomerQuery(text);
                      setSelectedCustomer(null);
                      setShowCustomerSuggestions(true);
                    }}
                    style={styles.input}
                    mode="outlined"
                    placeholder="Type to search customers"
                    right={
                      selectedCustomer ? (
                        <TextInput.Icon 
                          icon="close" 
                          onPress={() => {
                            setSelectedCustomer(null);
                            setCustomerQuery('');
                          }} 
                        />
                      ) : null
                    }
                    left={<TextInput.Icon icon="account-multiple" />}
                  />
                </View>
              </View>
              
              {/* Customer suggestions list moved outside of inputRow to appear above the button */}
              {showCustomerSuggestions && filteredCustomers.length > 0 && (
                <Surface style={styles.suggestionsList} elevation={4}>
                  <FlatList
                    data={filteredCustomers}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          setSelectedCustomer(item);
                          setCustomerQuery('');
                          setShowCustomerSuggestions(false);
                        }}
                      >
                        <Text style={styles.suggestionText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <Divider />}
                  />
                </Surface>
              )}
              
              <View style={styles.buttonContainer}>
                {!isRunning ? (
                  <Button 
                    mode="contained" 
                    onPress={startTimer} 
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    icon="play"
                  >
                    Start Timer
                  </Button>
                ) : (
                  <Button 
                    mode="contained" 
                    onPress={stopTimer} 
                    style={[styles.button, styles.stopButton]}
                    contentStyle={styles.buttonContent}
                    icon="stop"
                  >
                    Stop Timer
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.manualSection}>
          <Card style={styles.card} mode="elevated">
            <Card.Title title="Manual Time Entry" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.timeInputContainer}>
                <TextInput
                  label="Hours"
                  value={manualHours}
                  onChangeText={setManualHours}
                  keyboardType="numeric"
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                />
                <TextInput
                  label="Minutes"
                  value={manualMinutes}
                  onChangeText={setManualMinutes}
                  keyboardType="numeric"
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                />
              </View>
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                mode="outlined"
              />
              <View style={styles.customerSelector}>
                <TextInput
                  label="Customer"
                  value={selectedCustomer ? selectedCustomer.name : customerQuery}
                  onChangeText={(text) => {
                    setCustomerQuery(text);
                    setSelectedCustomer(null);
                    setShowCustomerSuggestions(true);
                  }}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Type to search customers"
                  right={
                    selectedCustomer ? (
                      <TextInput.Icon 
                        icon="close" 
                        onPress={() => {
                          setSelectedCustomer(null);
                          setCustomerQuery('');
                        }} 
                      />
                    ) : null
                  }
                  left={<TextInput.Icon icon="account-multiple" />}
                />
                
                {showCustomerSuggestions && filteredCustomers.length > 0 && (
                  <Surface style={styles.suggestionsList} elevation={4}>
                    <FlatList
                      data={filteredCustomers}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => {
                            setSelectedCustomer(item);
                            setCustomerQuery('');
                            setShowCustomerSuggestions(false);
                          }}
                        >
                          <Text style={styles.suggestionText}>{item.name}</Text>
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => <Divider />}
                    />
                  </Surface>
                )}
              </View>
              <Button 
                mode="contained" 
                onPress={addManualEntry} 
                style={styles.button}
                contentStyle={styles.buttonContent}
                icon="plus"
              >
                Add Entry
              </Button>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.entriesSection}>
          <Card style={styles.card} mode="elevated">
            <Card.Title title="Recent Time Entries" titleStyle={styles.cardTitle} />
            <Card.Content>
              {timeEntries.length > 0 ? (
                timeEntries.map((entry, index) => (
                  <View 
                    key={entry.id} 
                    style={[
                      styles.entryContainer, 
                      entry.customer && entry.customer !== 'Unassigned' ? styles.entryContainerWithCustomer : null
                    ]}
                  >
                    <Text variant="titleMedium" style={styles.entryTitle}>{entry.description}</Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryInfo}>Duration: {formatTime(entry.duration)}</Text>
                      <Text style={styles.entryInfo}>Date: {new Date(entry.timestamp).toLocaleDateString()}</Text>
                      <Text style={styles.entryInfo}>
                        Type: {entry.type === 'manual' ? 'Manual Entry' : 'Timer'}
                      </Text>
                      <Text style={styles.entryInfo}>
                        Customer: {entry.customer || 'Unassigned'}
                      </Text>
                    </View>
                    {index < timeEntries.length - 1 && <Divider style={styles.divider} />}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyMessage}>No time entries yet</Text>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* FAB removed since we now have tab navigation */}
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
  timerSection: {
    marginBottom: 20,
  },
  manualSection: {
    marginBottom: 20,
  },
  entriesSection: {
    marginBottom: 20,
  },
  timerCard: {
    elevation: 4,
    borderRadius: 8,
  },
  card: {
    elevation: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  timer: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 0.48,
  },
  inputRow: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  descriptionInput: {
    flex: 1,
  },
  customerSelector: {
    marginTop: 8,
    marginBottom: 8,
    zIndex: 1,
  },
  suggestionsList: {
    marginBottom: 12,
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 4,
    zIndex: 2,
  },
  suggestionItem: {
    padding: 12,
  },
  suggestionText: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    marginTop: 8,
    borderRadius: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  entryContainer: {
    marginVertical: 12,
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  entryContainerWithCustomer: {
    borderLeftColor: '#4CAF50',
  },
  entryTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryDetails: {
    marginLeft: 8,
  },
  entryInfo: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  divider: {
    marginVertical: 12,
  },
  emptyMessage: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
    color: '#888',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});
