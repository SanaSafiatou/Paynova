import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../../../src/theme/colors';

export default function OperationsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="deposit"
        options={{
          title: 'Dépôt',
          tabBarIcon: ({ color, size }) => <Ionicons name="arrow-down-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="withdrawal"
        options={{
          title: 'Retrait',
          tabBarIcon: ({ color, size }) => <Ionicons name="arrow-up-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
