import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/phone" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/personal-info" />
        <Stack.Screen name="auth/otp" />
        <Stack.Screen name="auth/set-pin" />
        <Stack.Screen name="auth/success" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(agent)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(superadmin)" />
        <Stack.Screen name="services/transfert" />
        <Stack.Screen name="services/recevoir" />
        <Stack.Screen name="services/payer" />
        <Stack.Screen name="services/epargne" />
        <Stack.Screen name="services/notifications" />
        <Stack.Screen name="services/menu" />
      </Stack>
    </AuthProvider>
  );
}
