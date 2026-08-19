import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

const PAYMENT_TYPES = [
  { icon: 'flash' as const, label: 'Facture', bg: '#FFF7ED', color: '#F59E0B' },
  { icon: 'school-outline' as const, label: 'Scolarité', bg: '#EFF6FF', color: '#3B82F6' },
  { icon: 'medkit-outline' as const, label: 'Santé', bg: '#FFF1F2', color: '#EC4899' },
  { icon: 'wifi-outline' as const, label: 'Internet', bg: '#F0FDF4', color: '#16A34A' },
];

export default function PayerScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!selectedType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de paiement.');
      return;
    }
    if (!beneficiary.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le bénéficiaire / référence.');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }

    Alert.alert(
      'Confirmer le paiement',
      `Payer ${num.toLocaleString('fr-FR')} F à ${beneficiary.trim()} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            await new Promise((r) => setTimeout(r, 1500));
            setLoading(false);
            Alert.alert('Succès', 'Paiement enregistré. En attente de confirmation backend.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payer</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Type de paiement</Text>
          <View style={styles.typeRow}>
            {PAYMENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.label}
                style={[styles.typeItem, selectedType === t.label && styles.typeItemActive]}
                onPress={() => setSelectedType(t.label)}
                activeOpacity={0.7}
              >
                <View style={[styles.typeIcon, { backgroundColor: t.bg }]}>
                  <Ionicons name={t.icon} size={20} color={t.color} />
                </View>
                <Text style={[styles.typeLabel, selectedType === t.label && styles.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.cardLabel}>Bénéficiaire / Référence</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom ou numéro de référence"
            placeholderTextColor={Colors.textMuted}
            value={beneficiary}
            onChangeText={setBeneficiary}
          />

          <Text style={styles.cardLabel}>Montant (FCFA)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity onPress={handlePay} disabled={loading} activeOpacity={0.8} style={styles.btnWrapper}>
            {loading ? (
              <View style={styles.btn}><ActivityIndicator color={Colors.white} /></View>
            ) : (
              <LinearGradient colors={['#8B5CF6', '#6D28D9', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                <Ionicons name="flash" size={18} color={Colors.white} />
                <Text style={styles.btnText}>Payer</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FC' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 18,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  card: { marginHorizontal: 22, marginTop: 20, backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 3 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8, marginTop: 14 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  typeItem: { alignItems: 'center', flex: 1, paddingVertical: 12, borderRadius: 12 },
  typeItemActive: { backgroundColor: '#F5F3FF' },
  typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  typeLabelActive: { color: Colors.primary },
  input: {
    borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary, backgroundColor: '#F9FAFB',
  },
  btnWrapper: { marginTop: 24 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 16, gap: 10 },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
