import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import CustomerScreen from './screens/CustomerScreen';
import ExportScreen from './screens/ExportScreen';
import TabBar from './components/TabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Define a custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    accent: '#03A9F4',
    background: '#f5f5f5',
    surface: '#ffffff',
  },
};

// Common screen options for consistent styling
const screenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  contentStyle: {
    backgroundColor: theme.colors.background,
  }
};

// Tab Navigator for both mobile and web
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={screenOptions}
      tabBar={props => <TabBar {...props} />}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Time Tracker',
          tabBarIcon: 'clock-outline'
        }} 
      />
      <Tab.Screen 
        name="Customer" 
        component={CustomerScreen} 
        options={{ 
          title: 'Customers',
          tabBarIcon: 'account-group'
        }} 
      />
      <Tab.Screen 
        name="Export" 
        component={ExportScreen} 
        options={{ 
          title: 'Export',
          tabBarIcon: 'file-export'
        }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
