import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { setPin } from '../../src/api/client';
import { Colors } from '../../src/theme/colors';

export default function SetPinScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [pin, setPin_] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetPin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Erreur', 'Le code PIN ne doit contenir que des chiffres.');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Erreur', 'Les codes PIN ne correspondent pas.');
      return;
    }

    setLoading(true);
    const result = await setPin(phone!, pin);
    setLoading(false);

    if (result.error) {
      Alert.alert('Erreur', Array.isArray(result.error) ? result.error[0] : result.error);
      return;
    }

    router.replace({
      pathname: '/auth/login',
      params: { phone: result.data!.phone },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.topDeco} />
          <View style={styles.topDeco2} />

          <View style={styles.logoContainer}>
            <View style={styles.logoTextRow}>
              <Text style={styles.logoTextPay}>Pay</Text>
              <Text style={styles.logoTextNova}>Nova</Text>
            </View>
            <Text style={styles.logoSubtitle}>Créez votre code PIN</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.labelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Code PIN (4 chiffres)</Text>
            </View>
            <TextInput
              style={styles.pinInput}
              placeholder="----"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={pin}
              onChangeText={setPin_}
              maxLength={4}
              secureTextEntry
              autoFocus
            />

            <View style={{ height: 16 }} />

            <View style={styles.labelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Confirmer le code PIN</Text>
            </View>
            <TextInput
              style={styles.pinInput}
              placeholder="----"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={confirmPin}
              onChangeText={setConfirmPin}
              maxLength={4}
              secureTextEntry
            />

            <Text style={styles.hint}>
              Ce code PIN servira à vous connecter à votre compte.
            </Text>

            <TouchableOpacity
              onPress={handleSetPin}
              disabled={loading}
              activeOpacity={0.8}
              style={[loading && styles.buttonDisabled]}
            >
              {loading ? (
                <View style={styles.buttonBase}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              ) : (
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9', '#5B21B6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonBase}
                >
                  <Text style={styles.buttonText}>Définir le code PIN</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={14} color={Colors.textSecondary} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
            <Text style={styles.securityText}>Vos données sont sécurisées et chiffrées</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 80,
  },
  topDeco: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EDE9FE',
    opacity: 0.5,
  },
  topDeco2: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DDD6FE',
    opacity: 0.3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoTextRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  logoTextPay: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoTextNova: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE7FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInput: {
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 20,
    color: Colors.textPrimary,
    backgroundColor: '#F9FAFB',
    letterSpacing: 10,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 4,
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  backText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  securityText: {
    fontSize: 11.5,
    color: Colors.textMuted,
  },
});
