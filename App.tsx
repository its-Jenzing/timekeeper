import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';

import HomeScreen from './screens/HomeScreen';
import CustomerScreen from './screens/CustomerScreen';
import ExportScreen from './screens/ExportScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Time Tracker' }} 
          />
          <Stack.Screen 
            name="Customer" 
            component={CustomerScreen} 
            options={{ title: 'Customer Management' }} 
          />
          <Stack.Screen 
            name="Export" 
            component={ExportScreen} 
            options={{ title: 'Export Time Records' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
