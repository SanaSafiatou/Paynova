import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminTransactionDetail, flagTransaction } from '../../../src/api/client';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await getAdminTransactionDetail(id);
    setLoading(false);
    if (res.data) setTx(res.data);
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    const res = await flagTransaction(id!, flagReason);
    if (!res.error) {
      setShowFlagModal(false);
      setFlagReason('');
      loadData();
    } else {
      Alert.alert('Erreur', res.error);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!tx) return <View style={styles.center}><Text>Transaction non trouvée</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, { backgroundColor: tx.status === 'SUCCESS' ? '#ECFDF5' : tx.status === 'FAILED' ? '#FEF2F2' : '#FFF7ED' }]}>
          <Ionicons
            name={tx.status === 'SUCCESS' ? 'checkmark-circle' : tx.status === 'FAILED' ? 'close-circle' : 'time'}
            size={32}
            color={tx.status === 'SUCCESS' ? '#22C55E' : tx.status === 'FAILED' ? '#EF4444' : '#F59E0B'}
          />
        </View>
        <Text style={styles.statusLabel}>{tx.status}</Text>
        <Text style={styles.txType}>{tx.type}</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="ID" value={tx.id} />
        <InfoRow label="Référence" value={tx.reference || '-'} />
        <InfoRow label="Montant" value={`${Number(tx.amount).toLocaleString('fr-FR')} F CFA`} />
        <InfoRow label="Frais" value={`${Number(tx.fees).toLocaleString('fr-FR')} F`} />
        <InfoRow label="Commission" value={`${Number(tx.commission).toLocaleString('fr-FR')} F`} />
        <InfoRow label="Montant net" value={`${Number(tx.netAmount).toLocaleString('fr-FR')} F`} />
        <InfoRow label="Client" value={tx.client?.name || tx.client?.phone || '-'} />
        <InfoRow label="Agent" value={tx.agent?.name || tx.agent?.phone || '-'} />
        <InfoRow label="Description" value={tx.description || '-'} />
        <InfoRow label="Date" value={new Date(tx.createdAt).toLocaleString('fr-FR')} />
      </View>

      {!tx.flagged && (
        <TouchableOpacity style={styles.flagBtn} onPress={() => setShowFlagModal(true)}>
          <Ionicons name="flag" size={18} color="#EF4444" />
          <Text style={styles.flagBtnText}>Signaler comme anormale</Text>
        </TouchableOpacity>
      )}

      {tx.flagged && (
        <View style={styles.flaggedCard}>
          <Ionicons name="flag" size={18} color="#EF4444" />
          <Text style={styles.flaggedText}>Signalée : {tx.flagReason}</Text>
        </View>
      )}

      {tx.reports?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Signalements</Text>
          {tx.reports.map((r: any) => (
            <View key={r.id} style={styles.reportCard}>
              <Text style={styles.reportReason}>{r.reason}</Text>
              <Text style={styles.reportStatus}>{r.status}</Text>
            </View>
          ))}
        </>
      )}

      {showFlagModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Signaler la transaction</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Raison du signalement"
              placeholderTextColor={Colors.textMuted}
              value={flagReason}
              onChangeText={setFlagReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowFlagModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, !flagReason.trim() && { opacity: 0.5 }]}
                onPress={handleFlag}
                disabled={!flagReason.trim()}
              >
                <Text style={styles.modalConfirmText}>Signaler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  label: { fontSize: 14, color: Colors.textMuted, flexShrink: 0 },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { padding: 22, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  statusCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 2,
  },
  statusIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statusLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  txType: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 4 },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 12, elevation: 2,
  },
  flagBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 16, backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 12,
  },
  flagBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  flaggedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14,
  },
  flaggedText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  reportCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2,
  },
  reportReason: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  reportStatus: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 22,
  },
  modal: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  modalInput: {
    backgroundColor: '#F8F7FC', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#F3F4F6' },
  modalCancelText: { color: Colors.textSecondary, fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#EF4444' },
  modalConfirmText: { color: Colors.white, fontWeight: '700' },
});
