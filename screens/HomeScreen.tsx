import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, Card, Text, TextInput, FAB, Divider, useTheme, Menu, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [customerMenuVisible, setCustomerMenuVisible] = useState(false);

  // Load customers from CustomerScreen
  useEffect(() => {
    // In a real app, this would come from a database or state management
    // For now, we'll simulate loading customers
    const loadCustomers = async () => {
      try {
        // This is where you would fetch from AsyncStorage or a database
        // For this example, we'll use some sample data
        const savedCustomers = [
          { id: '1', name: 'Acme Inc.' },
          { id: '2', name: 'TechCorp' },
          { id: '3', name: 'GlobalSoft' },
          { id: '4', name: 'Local Business' },
          { id: '5', name: 'Startup Co.' }
        ];
        setCustomers(savedCustomers);
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    
    loadCustomers();
  }, []);

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
  };

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
                  <Button 
                    mode="outlined" 
                    onPress={() => setCustomerMenuVisible(true)}
                    style={styles.customerButton}
                  >
                    {selectedCustomer ? selectedCustomer.name : "Select Customer"}
                  </Button>
                  <Menu
                    visible={customerMenuVisible}
                    onDismiss={() => setCustomerMenuVisible(false)}
                    anchor={<View />}
                    style={styles.customerMenu}
                  >
                    {customers.length > 0 ? (
                      <>
                        {customers.map((customer) => (
                          <Menu.Item
                            key={customer.id}
                            onPress={() => {
                              setSelectedCustomer(customer);
                              setCustomerMenuVisible(false);
                            }}
                            title={customer.name}
                          />
                        ))}
                        <Divider />
                        <Menu.Item
                          onPress={() => {
                            setSelectedCustomer(null);
                            setCustomerMenuVisible(false);
                          }}
                          title="Clear Selection"
                        />
                      </>
                    ) : (
                      <Menu.Item
                        title="No customers available"
                        disabled={true}
                      />
                    )}
                  </Menu>
                </View>
              </View>
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
                <Button 
                  mode="outlined" 
                  onPress={() => setCustomerMenuVisible(true)}
                  style={styles.customerButton}
                >
                  {selectedCustomer ? selectedCustomer.name : "Select Customer"}
                </Button>
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
  },
  customerButton: {
    borderRadius: 4,
  },
  customerMenu: {
    marginTop: 40,
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
