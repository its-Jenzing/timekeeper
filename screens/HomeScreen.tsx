import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Text, TextInput, FAB, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState([]);

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
      type: 'automatic'
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
        type: 'manual'
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
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Title title="Stopwatch Timer" />
          <Card.Content>
            <Text variant="headlineMedium" style={styles.timer}>
              {formatTime(elapsedTime)}
            </Text>
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />
            <View style={styles.buttonContainer}>
              {!isRunning ? (
                <Button mode="contained" onPress={startTimer} style={styles.button}>
                  Start Timer
                </Button>
              ) : (
                <Button mode="contained" onPress={stopTimer} style={[styles.button, styles.stopButton]}>
                  Stop Timer
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Manual Time Entry" />
          <Card.Content>
            <View style={styles.timeInputContainer}>
              <TextInput
                label="Hours"
                value={manualHours}
                onChangeText={setManualHours}
                keyboardType="numeric"
                style={[styles.input, styles.timeInput]}
              />
              <TextInput
                label="Minutes"
                value={manualMinutes}
                onChangeText={setManualMinutes}
                keyboardType="numeric"
                style={[styles.input, styles.timeInput]}
              />
            </View>
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />
            <Button 
              mode="contained" 
              onPress={addManualEntry} 
              style={styles.button}
            >
              Add Entry
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Recent Time Entries" />
          <Card.Content>
            {timeEntries.length > 0 ? (
              timeEntries.map((entry, index) => (
                <View key={entry.id} style={styles.entryContainer}>
                  <Text variant="titleMedium">{entry.description}</Text>
                  <Text>Duration: {formatTime(entry.duration)}</Text>
                  <Text>Date: {new Date(entry.timestamp).toLocaleDateString()}</Text>
                  <Text>Type: {entry.type === 'manual' ? 'Manual Entry' : 'Timer'}</Text>
                  {index < timeEntries.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text>No time entries yet</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="account"
        onPress={() => navigation.navigate('Customer')}
      />
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
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  timer: {
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 0.48,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    marginTop: 8,
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  entryContainer: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});
