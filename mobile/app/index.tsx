import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7FC' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/connexion" />;
  }

  if (user.role === 'SUPER_ADMIN') {
    return <Redirect href="/(superadmin)/dashboard" />;
  }

  if (user.role === 'AGENT') {
    return <Redirect href="/(agent)/dashboard" />;
  }

  if (user.role === 'ADMIN') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  if (user.role === 'COMMERCANT') {
    return <Redirect href="/(commercant)/dashboard" />;
  }

  return <Redirect href="/(main)/dashboard" />;
}
