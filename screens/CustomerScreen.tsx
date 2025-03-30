import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, TextInput, FAB, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingContact, setBillingContact] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [editingId, setEditingId] = useState(null);

  const saveCustomer = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    if (editingId) {
      // Update existing customer
      setCustomers(customers.map(customer => 
        customer.id === editingId 
          ? { 
              ...customer, 
              name, 
              email, 
              phone, 
              billingContact, 
              billingEmail, 
              billingPhone 
            } 
          : customer
      ));
      setEditingId(null);
    } else {
      // Add new customer
      const newCustomer = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        billingContact,
        billingEmail,
        billingPhone,
      };
      setCustomers([...customers, newCustomer]);
    }

    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setBillingContact('');
    setBillingEmail('');
    setBillingPhone('');
  };

  const editCustomer = (customer) => {
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setBillingContact(customer.billingContact || '');
    setBillingEmail(customer.billingEmail || '');
    setBillingPhone(customer.billingPhone || '');
    setEditingId(customer.id);
  };

  const deleteCustomer = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            setCustomers(customers.filter(customer => customer.id !== id));
            if (editingId === id) {
              setEditingId(null);
              setName('');
              setEmail('');
              setPhone('');
              setBillingContact('');
              setBillingEmail('');
              setBillingPhone('');
            }
          },
          style: 'destructive'
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Title title={editingId ? "Edit Customer" : "Add New Customer"} />
          <Card.Content>
            <TextInput
              label="Customer Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            
            <Text variant="titleMedium" style={styles.sectionTitle}>Billing Information</Text>
            
            <TextInput
              label="Billing Contact Name"
              value={billingContact}
              onChangeText={setBillingContact}
              style={styles.input}
            />
            <TextInput
              label="Billing Email"
              value={billingEmail}
              onChangeText={setBillingEmail}
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              label="Billing Phone"
              value={billingPhone}
              onChangeText={setBillingPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            
            <Button 
              mode="contained" 
              onPress={saveCustomer} 
              style={styles.button}
            >
              {editingId ? "Update Customer" : "Add Customer"}
            </Button>
            
            {editingId && (
              <Button 
                mode="outlined" 
                onPress={() => {
                  setEditingId(null);
                  setName('');
                  setEmail('');
                  setPhone('');
                  setBillingContact('');
                  setBillingEmail('');
                  setBillingPhone('');
                }} 
                style={styles.button}
              >
                Cancel Edit
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Customer List" />
          <Card.Content>
            {customers.length > 0 ? (
              customers.map((customer, index) => (
                <View key={customer.id}>
                  <List.Item
                    title={customer.name}
                    description={customer.email || 'No email provided'}
                    left={props => <List.Icon {...props} icon="account" />}
                    right={props => (
                      <View style={styles.actionButtons}>
                        <Button 
                          icon="pencil" 
                          mode="text" 
                          onPress={() => editCustomer(customer)}
                          style={styles.iconButton}
                        />
                        <Button 
                          icon="delete" 
                          mode="text" 
                          onPress={() => deleteCustomer(customer.id)}
                          style={styles.iconButton}
                        />
                      </View>
                    )}
                  />
                  {index < customers.length - 1 && <Divider />}
                </View>
              ))
            ) : (
              <Text>No customers added yet</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="file-export"
        onPress={() => navigation.navigate('Export')}
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
  input: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    margin: 0,
    padding: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});
