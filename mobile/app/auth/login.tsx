import { useState, useRef } from 'react';
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
import { login } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleLogin = async () => {
    if (code.length !== 4) {
      Alert.alert('Erreur', 'Le code doit contenir exactement 4 chiffres.');
      return;
    }

    setLoading(true);
    const result = await login(phone!, code);
    setLoading(false);

    if (result.error || !result.data) {
      if (result.error && result.error.includes('Aucun code PIN')) {
        router.push({ pathname: '/auth/set-pin', params: { phone: phone! } });
        return;
      }
      Alert.alert('Erreur', result.error || 'Connexion échouée');
      return;
    }

    await authLogin(result.data.accessToken, result.data.refreshToken, result.data.user);
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

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoTextRow}>
              <Text style={styles.logoTextPay}>Pay</Text>
              <Text style={styles.logoTextNova}>Nova</Text>
            </View>
            <Text style={styles.logoSubtitle}>Code de validation</Text>
          </View>

          {/* Carte formulaire */}
          <View style={styles.card}>
            {/* Champs code 4 chiffres */}
            <TouchableOpacity activeOpacity={1} onPress={focusInput}>
              <View style={styles.codeRow}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeBox,
                      code.length > i && styles.codeBoxFilled,
                    ]}
                  >
                    <Text style={styles.codeDigit}>
                      {code[i] || ''}
                    </Text>
                    {code.length === i && (
                      <View style={styles.cursor} />
                    )}
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              caretHidden
            />

            <Text style={styles.hint}>
              Entrez le code à 4 chiffres reçu
            </Text>

            {/* Bouton Se connecter */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading || code.length !== 4}
              activeOpacity={0.8}
              style={[styles.buttonWrapper, (loading || code.length !== 4) && styles.buttonDisabled]}
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
                  <Text style={styles.buttonText}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          {/* Retour */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={14} color={Colors.textSecondary} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          {/* Sécurité */}
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
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EDE9FE',
    opacity: 0.5,
  },
  topDeco2: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DDD6FE',
    opacity: 0.3,
  },

  /* Logo */
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

  /* Carte */
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    alignSelf: 'center',
  },
  phoneFlag: {
    fontSize: 18,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryDark,
  },

  /* Code 4 chiffres */
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 16,
  },
  codeBox: {
    width: 56,
    height: 62,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F3FF',
  },
  codeDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.01,
    fontSize: 24,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 28,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },

  /* Bouton */
  buttonWrapper: {
    marginTop: 20,
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
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

  /* Retour */
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

  /* Sécurité */
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
