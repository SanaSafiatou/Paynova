import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { identifyClient, agentWithdrawal } from '../../../src/api/client';

export default function WithdrawalScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState<any>(null);
  const [step, setStep] = useState<'phone' | 'confirm' | 'done'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleIdentify = async () => {
    if (phone.length < 9) {
      setError('Numéro invalide');
      return;
    }
    setLoading(true);
    setError('');
    const res = await identifyClient(phone);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setClient(res.data);
      setStep('confirm');
    }
  };

  const handleWithdrawal = async () => {
    const value = parseFloat(amount.replace(/,/g, ''));
    if (!value || value <= 0) {
      setError('Montant invalide');
      return;
    }
    if (client && value > client.balance) {
      setError('Solde insuffisant');
      return;
    }
    setLoading(true);
    setError('');
    const res = await agentWithdrawal({
      clientPhone: phone,
      amount: value,
      description: description || undefined,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setStep('done');
    }
  };

  const quickAmounts = ['5000', '10000', '25000', '50000', '100000'];

  if (step === 'done') {
    return (
      <View style={styles.doneContainer}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
        </View>
        <Text style={styles.doneTitle}>Retrait effectué</Text>
        <Text style={styles.doneAmount}>{parseFloat(amount.replace(/,/g, '')).toLocaleString('fr-FR')} F CFA</Text>
        <Text style={styles.doneSubtitle}>Retrait du compte de {client?.name || client?.phone}</Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            setPhone(''); setAmount(''); setDescription('');
            setClient(null); setStep('phone');
          }}
        >
          <Text style={styles.doneBtnText}>Nouveau retrait</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'confirm') {
    const value = parseFloat(amount.replace(/,/g, ''));
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Confirmer le retrait</Text>

          <View style={styles.clientCard}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitial}>{(client?.name || client?.phone || 'C')[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.clientName}>{client?.name || 'Sans nom'}</Text>
              <Text style={styles.clientPhone}>{client?.phone}</Text>
            </View>
            <View style={styles.clientBalance}>
              <Text style={styles.clientBalanceLabel}>Solde</Text>
              <Text style={styles.clientBalanceValue}>{(client?.balance || 0).toLocaleString('fr-FR')} F</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montant</Text>
              <Text style={styles.summaryValue}>{value.toLocaleString('fr-FR')} F CFA</Text>
            </View>
            {description ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Description</Text>
                <Text style={styles.summaryValue}>{description}</Text>
              </View>
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleWithdrawal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Confirmer le retrait</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Retrait</Text>
        <Text style={styles.subtitle}>Identifiez le client</Text>

        <Text style={styles.label}>Numéro du client</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 06XXXXXXXX"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={12}
        />

        <Text style={styles.label}>Montant (F CFA)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
        />

        <View style={styles.quickRow}>
          {quickAmounts.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.quickBtn, amount === q && styles.quickBtnActive]}
              onPress={() => setAmount(q)}
            >
              <Text style={[styles.quickBtnText, amount === q && styles.quickBtnTextActive]}>
                {parseInt(q).toLocaleString('fr-FR')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Motif du retrait"
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleIdentify}
          disabled={loading || phone.length < 9}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Rechercher le client</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { padding: 22, paddingBottom: 100 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.white },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 10 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
  },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  clientCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, elevation: 2,
  },
  clientAvatar: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  clientInitial: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  clientName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  clientPhone: { fontSize: 13, color: Colors.textMuted },
  clientBalance: { marginLeft: 'auto', alignItems: 'flex-end' },
  clientBalanceLabel: { fontSize: 11, color: Colors.textMuted },
  clientBalanceValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginTop: 12, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: Colors.textMuted },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  doneContainer: { flex: 1, backgroundColor: '#F8F7FC', justifyContent: 'center', alignItems: 'center', padding: 22 },
  doneIcon: { marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  doneAmount: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginVertical: 8 },
  doneSubtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 32 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 16 },
  doneBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
