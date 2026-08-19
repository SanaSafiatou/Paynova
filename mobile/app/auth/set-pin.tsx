import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { setPin } from '../../src/api/client';

export default function SetPinScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [pin, setPin_] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetPin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Error', 'PIN must contain only digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setLoading(true);
    const result = await setPin(phone!, pin);
    setLoading(false);

    if (result.error) {
      Alert.alert('Error', Array.isArray(result.error) ? result.error[0] : result.error);
      return;
    }

    router.replace({
      pathname: '/auth/success',
      params: { phone: result.data!.phone },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create PIN</Text>
        <Text style={styles.subtitle}>
          Set a 4-digit PIN to secure your PayNova account.{'\n'}
          You will use this PIN to log in.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Enter PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="----"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          value={pin}
          onChangeText={setPin_}
          maxLength={4}
          secureTextEntry
          autoFocus
        />

        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="----"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          value={confirmPin}
          onChangeText={setConfirmPin}
          maxLength={4}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSetPin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Set PIN</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    backgroundColor: '#f8f8f8',
    textAlign: 'center',
    letterSpacing: 12,
  },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
