import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { reportSuspect } from '../../src/api/client';

export default function AgentSignaler() {
  const router = useRouter();
  const [transactionId, setTransactionId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Montant suspect',
    'Comportement anormal',
    'Identification douteuse',
    'Transaction non autorisée',
    'Autre',
  ];

  const handleSubmit = async () => {
    if (!transactionId || !reason) {
      setError('Remplissez les champs obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    const res = await reportSuspect({
      transactionId,
      reason,
      description: description || undefined,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={styles.doneContainer}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
        </View>
        <Text style={styles.doneTitle}>Signalement envoyé</Text>
        <Text style={styles.doneSubtitle}>L'administrateur examinera votre signalement.</Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.doneBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Signaler une opération</Text>
        <Text style={styles.subtitle}>Identifiez l'opération suspecte</Text>

        <Text style={styles.label}>ID de la transaction</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: txn_xxxxxxxxxxxx"
          placeholderTextColor={Colors.textMuted}
          value={transactionId}
          onChangeText={setTransactionId}
        />

        <Text style={styles.label}>Motif</Text>
        <View style={styles.reasonsGrid}>
          {reasons.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonBtn, reason === r && styles.reasonActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Détails supplémentaires..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={loading || !transactionId || !reason}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Envoyer le signalement</Text>
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
  textArea: { height: 100, paddingTop: 14 },
  reasonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  reasonActive: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
  reasonText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  reasonTextActive: { color: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 10 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
  },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  doneContainer: { flex: 1, backgroundColor: '#F8F7FC', justifyContent: 'center', alignItems: 'center', padding: 22 },
  doneIcon: { marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  doneSubtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 32 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  doneBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
