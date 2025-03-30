import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { IconButton } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const isWeb = Platform.OS === 'web';

  // Styles for web (top tabs) vs mobile (bottom tabs)
  const containerStyle = {
    ...styles.container,
    ...(isWeb 
      ? { 
          flexDirection: 'row', 
          justifyContent: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.surfaceVariant,
          position: 'relative' as 'relative',
          top: 0,
        } 
      : { 
          flexDirection: 'row', 
          justifyContent: 'space-around',
          borderTopWidth: 1,
          borderTopColor: theme.colors.surfaceVariant,
          position: 'absolute' as 'absolute',
          bottom: 0,
        }
    ),
    backgroundColor: theme.colors.surface,
  };

  return (
    <View style={containerStyle}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;
        
        // Get the icon name from options
        const iconName = options.tabBarIcon as string || 'circle';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableRipple
            key={route.key}
            onPress={onPress}
            style={[
              styles.tab,
              isWeb ? styles.webTab : styles.mobileTab,
              isFocused && (isWeb ? styles.webActiveTab : styles.mobileActiveTab)
            ]}
            rippleColor={theme.colors.primaryContainer}
          >
            <View style={styles.tabContent}>
              <IconButton
                icon={iconName}
                size={24}
                iconColor={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                style={styles.icon}
              />
              <Text 
                style={[
                  styles.label,
                  { color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant }
                ]}
              >
                {label}
              </Text>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTab: {
    paddingHorizontal: 20,
    height: 60,
    maxWidth: 200,
  },
  mobileTab: {
    height: 60,
  },
  webActiveTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#2196F3',
  },
  mobileActiveTab: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    margin: 0,
    padding: 0,
  },
  label: {
    fontSize: 12,
    marginTop: -5,
  },
});
