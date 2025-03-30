import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, TextInput, FAB, List, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerScreen({ navigation }) {
  const theme = useTheme();
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.card} mode="elevated">
          <Card.Title 
            title={editingId ? "Edit Customer" : "Add New Customer"} 
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <TextInput
              label="Customer Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="email" />}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="phone" />}
            />
            
            <View style={styles.sectionTitleContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Billing Information</Text>
              <Divider style={styles.sectionDivider} />
            </View>
            
            <TextInput
              label="Billing Contact Name"
              value={billingContact}
              onChangeText={setBillingContact}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="account-tie" />}
            />
            <TextInput
              label="Billing Email"
              value={billingEmail}
              onChangeText={setBillingEmail}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
            />
            <TextInput
              label="Billing Phone"
              value={billingPhone}
              onChangeText={setBillingPhone}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="phone-outline" />}
            />
            
            <View style={styles.buttonGroup}>
              <Button 
                mode="contained" 
                onPress={saveCustomer} 
                style={styles.button}
                icon={editingId ? "content-save" : "plus-circle"}
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
                  icon="cancel"
                >
                  Cancel Edit
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Title title="Customer List" titleStyle={styles.cardTitle} />
          <Card.Content>
            {customers.length > 0 ? (
              <View style={styles.customerList}>
                {customers.map((customer, index) => (
                  <View key={customer.id} style={styles.customerItem}>
                    <List.Item
                      title={customer.name}
                      titleStyle={styles.customerName}
                      description={customer.email || 'No email provided'}
                      descriptionStyle={styles.customerEmail}
                      left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
                      right={props => (
                        <View style={styles.actionButtons}>
                          <Button 
                            icon="pencil" 
                            mode="contained-tonal" 
                            onPress={() => editCustomer(customer)}
                            style={styles.iconButton}
                            compact
                          />
                          <Button 
                            icon="delete" 
                            mode="contained-tonal" 
                            onPress={() => deleteCustomer(customer.id)}
                            style={[styles.iconButton, styles.deleteButton]}
                            compact
                          />
                        </View>
                      )}
                    />
                    {index < customers.length - 1 && <Divider style={styles.customerDivider} />}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyMessage}>No customers added yet</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="file-export"
        onPress={() => navigation.navigate('Export')}
        color="#fff"
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
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  card: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  sectionTitleContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDivider: {
    backgroundColor: '#2196F3',
    height: 2,
  },
  buttonGroup: {
    marginTop: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 4,
  },
  customerList: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  customerItem: {
    marginVertical: 4,
  },
  customerName: {
    fontWeight: 'bold',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
  },
  customerDivider: {
    height: 1,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    margin: 4,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
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
    backgroundColor: '#4CAF50',
  },
});
