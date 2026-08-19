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
import { useRouter } from 'expo-router';
import { register } from '../../src/api/client';
import { Colors } from '../../src/theme/colors';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const fullPhone = `+225${phone}`;

    if (phone.length < 8 || phone.length > 10) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide (8 à 10 chiffres).');
      return;
    }

    if (!/^\d+$/.test(phone)) {
      Alert.alert('Erreur', 'Le numéro ne doit contenir que des chiffres.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom et prénom.');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Erreur', 'Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }

    setLoading(true);
    const result = await register(fullPhone, pin);
    setLoading(false);

    if (result.error) {
      Alert.alert('Erreur', Array.isArray(result.error) ? result.error[0] : result.error);
      return;
    }

    if (result.data!.exists) {
      router.push({ pathname: '/auth/login', params: { phone: fullPhone } });
      return;
    }

    router.replace({ pathname: '/auth/personal-info', params: { phone: result.data!.phone, name: name.trim() } });
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
            <Text style={styles.logoSubtitle}>Créez votre compte</Text>
          </View>

          {/* Carte formulaire */}
          <View style={styles.card}>
            {/* Champ téléphone */}
            <View style={styles.labelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Numéro de téléphone</Text>
            </View>
            <View style={styles.phoneRow}>
              <TouchableOpacity style={styles.prefixBox} activeOpacity={0.7}>
                <Text style={styles.flag}>🇨🇮</Text>
                <Text style={styles.prefix}>+225</Text>
                <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder="07 01 02 03 04"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={phone}
                onChangeText={setPhone}
                autoFocus
                maxLength={10}
              />
            </View>

            <View style={{ height: 20 }} />

            {/* Champ nom */}
            <View style={styles.labelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Nom et prénom</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Entrez votre nom et prénom"
              placeholderTextColor={Colors.textMuted}
              keyboardType="default"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            <View style={{ height: 20 }} />

            {/* Champ PIN */}
            <View style={styles.labelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Code PIN</Text>
            </View>
            <View style={styles.pinRow}>
              <View style={styles.pinInputContainer}>
                <TextInput
                  style={styles.pinInput}
                  placeholder=""
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  value={pin}
                  onChangeText={setPin}
                  maxLength={4}
                  secureTextEntry={!showPin}
                />
              </View>
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPin(!showPin)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPin ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Entrez un code PIN à 4 chiffres</Text>

            {/* Bouton Continuer */}
            <TouchableOpacity
              onPress={handleRegister}
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
                  <Text style={styles.buttonText}>Continuer</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          {/* Sécurité */}
          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
            <Text style={styles.securityText}>Vos données sont sécurisées et chiffrées</Text>
          </View>

          {/* Bas de page */}
          <View style={styles.bottomFeatures}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Sécurisé</Text>
              <Text style={styles.featureDesc}>Votre sécurité est notre priorité</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="flash-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Rapide</Text>
              <Text style={styles.featureDesc}>Transferts en temps réel</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Fiable</Text>
              <Text style={styles.featureDesc}>Un service de confiance</Text>
            </View>
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
    paddingTop: 64,
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
  shieldWrapper: {
    width: 88,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 10,
    height: 52,
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: '#F9FAFB',
    height: 52,
  },
  hint: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: 2,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinInputContainer: {
    width: 140,
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
  eyeBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    fontSize: 11.5,
    color: Colors.textMuted,
  },
  bottomFeatures: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 36,
    gap: 8,
  },
  featureItem: {
    alignItems: 'center',
    width: 98,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE7FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  featureDivider: {
    width: 1,
    height: 52,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
});
