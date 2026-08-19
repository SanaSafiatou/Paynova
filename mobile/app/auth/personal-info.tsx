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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { completeProfile } from '../../src/api/client';
import { Colors } from '../../src/theme/colors';

export default function PersonalInfoScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet.');
      return;
    }

    if (!day || !month || !year) {
      Alert.alert('Erreur', 'Veuillez entrer votre date de naissance complète.');
      return;
    }

    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > 2010) {
      Alert.alert('Erreur', 'Date de naissance invalide.');
      return;
    }

    const dateOfBirth = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    setLoading(true);
    const result = await completeProfile(phone!, name.trim(), dateOfBirth);
    setLoading(false);

    if (result.error) {
      Alert.alert('Erreur', Array.isArray(result.error) ? result.error[0] : result.error);
      return;
    }

    router.replace({ pathname: '/auth/login', params: { phone: phone! } });
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
            <View style={styles.shield}>
              <MaterialCommunityIcons name="shield-half-full" size={40} color={Colors.white} />
            </View>
            <View style={styles.logoTextRow}>
              <Text style={styles.logoTextPay}>Pay</Text>
              <Text style={styles.logoTextNova}>Nova</Text>
            </View>
          </View>

          {/* Indicateur d'étapes */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, styles.stepDone]}>
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              </View>
              <View style={[styles.stepLine, styles.stepLineDone]} />
              <View style={[styles.stepCircle, styles.stepActive]}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
            </View>
            <View style={styles.stepLabelsRow}>
              <Text style={styles.stepLabelDone}>Numéro</Text>
              <Text style={styles.stepLabelActive}>Informations</Text>
            </View>
          </View>

          {/* Carte formulaire */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            <Text style={styles.cardSubtitle}>Complétez votre profil pour utiliser PayNova</Text>

            {/* Champ nom */}
            <View style={styles.labelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Nom complet</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ex : Kouassi Yao"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              textContentType="name"
            />
            <Text style={styles.hint}>Entrez votre nom et prénom</Text>

            <View style={styles.fieldDivider} />

            {/* Champ date de naissance */}
            <View style={styles.labelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Date de naissance</Text>
            </View>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.dateInput, styles.dateInputShort]}
                placeholder="JJ"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={day}
                onChangeText={setDay}
                maxLength={2}
              />
              <Text style={styles.dateSep}>/</Text>
              <TextInput
                style={[styles.dateInput, styles.dateInputShort]}
                placeholder="MM"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={month}
                onChangeText={setMonth}
                maxLength={2}
              />
              <Text style={styles.dateSep}>/</Text>
              <TextInput
                style={[styles.dateInput, styles.dateInputLong]}
                placeholder="AAAA"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={year}
                onChangeText={setYear}
                maxLength={4}
              />
            </View>
            <Text style={styles.hint}>Format : jour / mois / année</Text>

            {/* Bouton Continuer */}
            <TouchableOpacity
              onPress={handleContinue}
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
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 64,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shield: {
    width: 64,
    height: 76,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoTextRow: {
    flexDirection: 'row',
  },
  logoTextPay: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoTextNova: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  stepsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDone: {
    backgroundColor: Colors.primary,
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  stepLine: {
    width: 48,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.inputBorder,
    marginHorizontal: 8,
  },
  stepLineDone: {
    backgroundColor: Colors.primary,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 56,
  },
  stepLabelDone: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  stepLabelActive: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: '#F9FAFB',
  },
  hint: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: 2,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  dateInputShort: {
    flex: 1,
  },
  dateInputLong: {
    flex: 1.6,
  },
  dateSep: {
    fontSize: 18,
    color: Colors.textMuted,
    fontWeight: '600',
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
});
