import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function SuccessScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topDeco} />

      <View style={styles.icon}>
        <Text style={styles.checkmark}>✓</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Tout est prêt !</Text>
        <Text style={styles.subtitle}>
          Votre compte est configuré.{'\n'}
          <Text style={styles.phone}>{phone}</Text> est sécurisé.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/auth/phone')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topDeco: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primaryLight,
    opacity: 0.3,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkmark: {
    fontSize: 40,
    color: Colors.white,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phone: {
    fontWeight: '600',
    color: Colors.primary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 56,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
