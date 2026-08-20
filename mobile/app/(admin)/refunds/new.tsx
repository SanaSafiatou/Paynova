import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { searchTransactionsForRefund, createRefund } from '../../../src/api/client';

export default function NewRefundScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [debitUserId, setDebitUserId] = useState('');
  const [creditUserId, setCreditUserId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await searchTransactionsForRefund(searchQuery.trim());
    setSearching(false);
    if (res.data) {
      setTransactions(Array.isArray(res.data) ? res.data : []);
      setSelectedTx(null);
    }
  };

  const handleSelect = (tx: any) => {
    setSelectedTx(tx);
    if (tx.client?.id) setCreditUserId(tx.client.id);
    setRefundAmount(String(Number(tx.amount)));
  };

  const handleSubmit = async () => {
    if (!selectedTx) return Alert.alert('Erreur', 'Sélectionnez une transaction');
    if (!debitUserId) return Alert.alert('Erreur', 'Sélectionnez le compte à débiter');
    if (!creditUserId) return Alert.alert('Erreur', 'Sélectionnez le compte à créditer');
    if (!refundAmount || Number(refundAmount) <= 0) return Alert.alert('Erreur', 'Montant invalide');
    if (Number(refundAmount) > Number(selectedTx.amount)) {
      return Alert.alert('Erreur', 'Le remboursement ne peut pas dépasser le montant de la transaction');
    }
    if (!reason.trim()) return Alert.alert('Erreur', 'Raison requise');

    Alert.alert(
      'Confirmer le remboursement',
      `Rembourser ${Number(refundAmount).toLocaleString()} FCFA ?\n\nDébit: ${debitUserId.substring(0, 8)}...\nCrédit: ${creditUserId.substring(0, 8)}...`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Créer',
          onPress: async () => {
            setSubmitting(true);
            const res = await createRefund({
              transactionId: selectedTx.id,
              refundAmount: Number(refundAmount),
              reason: reason.trim(),
              debitUserId,
              creditUserId,
              note: note.trim() || undefined,
            });
            setSubmitting(false);
            if (res.error) return Alert.alert('Erreur', res.error);
            Alert.alert('Succès', 'Demande de remboursement créée', [
              { text: 'OK', onPress: () => router.replace('/(admin)/refunds') },
            ]);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau remboursement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search Transaction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Rechercher la transaction</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Référence ou ID..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
              {searching ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="search" size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {transactions.length > 0 && !selectedTx && (
            <View style={styles.resultsList}>
              {transactions.map((tx) => (
                <TouchableOpacity key={tx.id} style={styles.resultItem} onPress={() => handleSelect(tx)}>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultRef}>{tx.reference || tx.id.substring(0, 12)}</Text>
                    <Text style={styles.resultDetail}>
                      {tx.type} | {Number(tx.amount).toLocaleString()} FCFA | {tx.status}
                    </Text>
                    <Text style={styles.resultUser}>
                      Client: {tx.client?.phone || '—'} | Agent: {tx.agent?.phone || '—'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Selected Transaction Details */}
        {selectedTx && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction sélectionnée</Text>
            <View style={styles.selectedTx}>
              <View style={styles.selectedTxHeader}>
                <Text style={styles.selectedTxRef}>{selectedTx.reference || selectedTx.id}</Text>
                <TouchableOpacity onPress={() => setSelectedTx(null)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectedTxDetail}>
                {selectedTx.type} | {Number(selectedTx.amount).toLocaleString()} FCFA | Frais: {Number(selectedTx.fees).toLocaleString()} FCFA
              </Text>
              <Text style={styles.selectedTxDetail}>
                Client: {selectedTx.client?.name || selectedTx.client?.phone || '—'}
              </Text>
              <Text style={styles.selectedTxDetail}>
                Agent: {selectedTx.agent?.name || selectedTx.agent?.phone || '—'}
              </Text>
            </View>
          </View>
        )}

        {/* Accounts */}
        {selectedTx && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Comptes</Text>

            <Text style={styles.fieldLabel}>Compte à débiter (celui qui reçoit le remboursement)</Text>
            <View style={styles.accountOptions}>
              {selectedTx.client && (
                <TouchableOpacity
                  style={[styles.accountOption, debitUserId === selectedTx.client.id && styles.accountOptionActive]}
                  onPress={() => setDebitUserId(selectedTx.client.id)}
                >
                  <Ionicons name="person" size={16} color={debitUserId === selectedTx.client.id ? Colors.primary : Colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountOptionName}>{selectedTx.client.name || selectedTx.client.phone}</Text>
                    <Text style={styles.accountOptionDetail}>Solde: {Number(selectedTx.client.balance || 0).toLocaleString()} FCFA</Text>
                  </View>
                  {debitUserId === selectedTx.client.id && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              )}
              {selectedTx.agent && (
                <TouchableOpacity
                  style={[styles.accountOption, debitUserId === selectedTx.agent.id && styles.accountOptionActive]}
                  onPress={() => setDebitUserId(selectedTx.agent.id)}
                >
                  <Ionicons name="people" size={16} color={debitUserId === selectedTx.agent.id ? Colors.primary : Colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountOptionName}>{selectedTx.agent.name || selectedTx.agent.phone}</Text>
                    <Text style={styles.accountOptionDetail}>Solde: {Number(selectedTx.agent.balance || 0).toLocaleString()} FCFA</Text>
                  </View>
                  {debitUserId === selectedTx.agent.id && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Compte à créditer (celui qui paie le remboursement)</Text>
            <View style={styles.accountOptions}>
              {selectedTx.client && (
                <TouchableOpacity
                  style={[styles.accountOption, creditUserId === selectedTx.client.id && styles.accountOptionActive]}
                  onPress={() => setCreditUserId(selectedTx.client.id)}
                >
                  <Ionicons name="person" size={16} color={creditUserId === selectedTx.client.id ? Colors.primary : Colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountOptionName}>{selectedTx.client.name || selectedTx.client.phone}</Text>
                    <Text style={styles.accountOptionDetail}>Solde: {Number(selectedTx.client.balance || 0).toLocaleString()} FCFA</Text>
                  </View>
                  {creditUserId === selectedTx.client.id && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              )}
              {selectedTx.agent && (
                <TouchableOpacity
                  style={[styles.accountOption, creditUserId === selectedTx.agent.id && styles.accountOptionActive]}
                  onPress={() => setCreditUserId(selectedTx.agent.id)}
                >
                  <Ionicons name="people" size={16} color={creditUserId === selectedTx.agent.id ? Colors.primary : Colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountOptionName}>{selectedTx.agent.name || selectedTx.agent.phone}</Text>
                    <Text style={styles.accountOptionDetail}>Solde: {Number(selectedTx.agent.balance || 0).toLocaleString()} FCFA</Text>
                  </View>
                  {creditUserId === selectedTx.agent.id && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Amount & Reason */}
        {selectedTx && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Montant et raison</Text>

            <Text style={styles.fieldLabel}>Montant du remboursement (max: {Number(selectedTx.amount).toLocaleString()} FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="Montant en FCFA"
              placeholderTextColor={Colors.textMuted}
              value={refundAmount}
              onChangeText={setRefundAmount}
              keyboardType="numeric"
            />

            <Text style={styles.feeInfo}>
              Frais originaux: {Number(selectedTx.fees).toLocaleString()} FCFA
            </Text>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Raison *</Text>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              placeholder="Raison du remboursement..."
              placeholderTextColor={Colors.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Note (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Note interne..."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>
        )}

        {selectedTx && (
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.white} />
                <Text style={styles.submitBtnText}>Créer la demande de remboursement</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10,
  },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  searchBtn: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  resultsList: { marginTop: 10 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  resultInfo: { flex: 1 },
  resultRef: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  resultDetail: { fontSize: 11, color: Colors.textPrimary, marginTop: 2 },
  resultUser: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  selectedTx: {
    backgroundColor: '#F0F9FF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#BAE6FD',
  },
  selectedTxHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  selectedTxRef: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  selectedTxDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  accountOptions: { gap: 6 },
  accountOption: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  accountOptionActive: {
    borderColor: Colors.primary, backgroundColor: '#F5F3FF',
  },
  accountOptionName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  accountOptionDetail: { fontSize: 10, color: Colors.textMuted },
  input: {
    height: 42, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  feeInfo: { fontSize: 11, color: Colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, padding: 16, marginTop: 8,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
