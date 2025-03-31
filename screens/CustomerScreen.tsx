import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Keyboard } from 'react-native';
import { Button, Card, Text, TextInput, FAB, List, Divider, useTheme, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CustomerScreen({ navigation }) {
  const theme = useTheme();
  // Initialize with some sample customers
  const [customers, setCustomers] = useState([
    { 
      id: '1', 
      name: 'Acme Inc.',
      email: 'contact@acme.com',
      phone: '555-123-4567',
      billingContact: 'John Doe',
      billingEmail: 'billing@acme.com',
      billingPhone: '555-123-4568'
    },
    { 
      id: '2', 
      name: 'TechCorp',
      email: 'info@techcorp.com',
      phone: '555-987-6543',
      billingContact: 'Jane Smith',
      billingEmail: 'accounting@techcorp.com',
      billingPhone: '555-987-6544'
    },
    { 
      id: '3', 
      name: 'GlobalSoft',
      email: 'hello@globalsoft.com',
      phone: '555-456-7890',
      billingContact: 'Mike Johnson',
      billingEmail: 'finance@globalsoft.com',
      billingPhone: '555-456-7891'
    }
  ]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [billingContact, setBillingContact] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingEmailError, setBillingEmailError] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingPhoneError, setBillingPhoneError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Load customers from storage on initial render
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const savedCustomers = await AsyncStorage.getItem('customers');
        if (savedCustomers) {
          setCustomers(JSON.parse(savedCustomers));
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    
    loadCustomers();
  }, []);

  // Save customers to storage whenever the list changes
  useEffect(() => {
    const saveCustomersToStorage = async () => {
      try {
        await AsyncStorage.setItem('customers', JSON.stringify(customers));
        console.log('Customers saved:', customers);
      } catch (error) {
        console.error('Failed to save customers:', error);
      }
    };
    
    saveCustomersToStorage();
  }, [customers]);

  // Format phone number as (555)123-4567
  const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format the phone number
    if (cleaned.length === 0) {
      return '';
    } else if (cleaned.length <= 3) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)})${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === '' || emailRegex.test(email);
  };

  // Handle phone number input
  const handlePhoneChange = (text) => {
    const formattedNumber = formatPhoneNumber(text);
    setPhone(formattedNumber);
    setPhoneError('');
  };

  // Handle billing phone number input
  const handleBillingPhoneChange = (text) => {
    const formattedNumber = formatPhoneNumber(text);
    setBillingPhone(formattedNumber);
    setBillingPhoneError('');
  };

  // Handle email input
  const handleEmailChange = (text) => {
    setEmail(text);
    if (!validateEmail(text) && text !== '') {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Handle billing email input
  const handleBillingEmailChange = (text) => {
    setBillingEmail(text);
    if (!validateEmail(text) && text !== '') {
      setBillingEmailError('Please enter a valid email address');
    } else {
      setBillingEmailError('');
    }
  };

  const saveCustomer = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    // Validate email and phone before saving
    let hasError = false;
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }
    
    if (!validateEmail(billingEmail)) {
      setBillingEmailError('Please enter a valid email address');
      hasError = true;
    }
    
    if (hasError) {
      Alert.alert('Error', 'Please fix the errors before saving');
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
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="email" />}
              error={!!emailError}
            />
            {!!emailError && <HelperText type="error">{emailError}</HelperText>}
            
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="phone" />}
              error={!!phoneError}
            />
            {!!phoneError && <HelperText type="error">{phoneError}</HelperText>}
            
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
              onChangeText={handleBillingEmailChange}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
              error={!!billingEmailError}
            />
            {!!billingEmailError && <HelperText type="error">{billingEmailError}</HelperText>}
            
            <TextInput
              label="Billing Phone"
              value={billingPhone}
              onChangeText={handleBillingPhoneChange}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="phone-outline" />}
              error={!!billingPhoneError}
            />
            {!!billingPhoneError && <HelperText type="error">{billingPhoneError}</HelperText>}
            
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
