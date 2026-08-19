import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getRefundDetail, approveRefund, refuseRefund, executeRefund } from '../../../src/api/client';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  APPROVED: '#3B82F6',
  COMPLETED: '#10B981',
  REFUSED: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  COMPLETED: 'Terminé',
  REFUSED: 'Refusé',
};

export default function RefundDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refund, setRefund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRefund = async () => {
    if (!id) return;
    setLoading(true);
    const res = await getRefundDetail(id);
    setLoading(false);
    if (res.data) setRefund(res.data);
  };

  useEffect(() => { loadRefund(); }, [id]);

  const handleApprove = () => {
    Alert.alert('Approuver le remboursement', 'Confirmer l\'approbation de ce remboursement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Approuver',
        onPress: async () => {
          setActionLoading(true);
          const res = await approveRefund(id!);
          setActionLoading(false);
          if (res.error) return Alert.alert('Erreur', res.error);
          Alert.alert('Succès', 'Remboursement approuvé');
          loadRefund();
        },
      },
    ]);
  };

  const handleRefuse = () => {
    Alert.alert('Refuser le remboursement', 'Confirmer le refus de ce remboursement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const res = await refuseRefund(id!);
          setActionLoading(false);
          if (res.error) return Alert.alert('Erreur', res.error);
          Alert.alert('Refusé', 'Remboursement refusé');
          loadRefund();
        },
      },
    ]);
  };

  const handleExecute = () => {
    Alert.alert(
      'Exécuter le remboursement',
      `Débiter ${refund.debitUser?.phone} et créditer ${refund.creditUser?.phone} de ${Number(refund.refundAmount).toLocaleString()} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exécuter',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            const res = await executeRefund(id!);
            setActionLoading(false);
            if (res.error) return Alert.alert('Erreur', res.error);
            Alert.alert('Terminé', 'Remboursement exécuté avec succès');
            loadRefund();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!refund) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textMuted }}>Remboursement non trouvé</Text>
      </View>
    );
  }

  const tx = refund.transaction;
  const statusColor = STATUS_COLORS[refund.status] || Colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Détail remboursement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '15' }]}>
          <Ionicons name={refund.status === 'COMPLETED' ? 'checkmark-circle' : 'time-outline'} size={24} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[refund.status]}</Text>
        </View>

        {/* Refund Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remboursement</Text>
          <InfoRow label="Référence" value={refund.refundReference} icon="receipt-outline" />
          <InfoRow label="Montant" value={`${Number(refund.refundAmount).toLocaleString()} FCFA`} icon="cash-outline" />
          <InfoRow label="Raison" value={refund.reason} icon="document-text-outline" />
          {refund.note && <InfoRow label="Note" value={refund.note} icon="create-outline" />}
          <InfoRow label="Date création" value={new Date(refund.createdAt).toLocaleString('fr-FR')} icon="calendar-outline" />
          {refund.executedAt && (
            <InfoRow label="Exécuté le" value={new Date(refund.executedAt).toLocaleString('fr-FR')} icon="checkmark-done-outline" />
          )}
        </View>

        {/* Original Transaction */}
        {tx && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction originale</Text>
            <InfoRow label="Type" value={tx.type} icon="swap-horizontal-outline" />
            <InfoRow label="Montant" value={`${Number(tx.amount).toLocaleString()} FCFA`} icon="cash-outline" />
            <InfoRow label="Frais" value={`${Number(tx.fees).toLocaleString()} FCFA`} icon="receipt-outline" />
            <InfoRow label="Statut" value={tx.status} icon="information-circle-outline" />
            <InfoRow label="Référence" value={tx.reference || 'N/A'} icon="link-outline" />
            {tx.client && <InfoRow label="Client" value={`${tx.client.name || tx.client.phone}`} icon="person-outline" />}
            {tx.agent && <InfoRow label="Agent" value={`${tx.agent.name || tx.agent.phone}`} icon="people-outline" />}
          </View>
        )}

        {/* Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comptes concernés</Text>
          <View style={styles.accountsRow}>
            <View style={[styles.accountCard, styles.debitCard]}>
              <Ionicons name="arrow-up-circle" size={20} color="#EF4444" />
              <Text style={styles.accountLabel}>À débiter</Text>
              <Text style={styles.accountName}>{refund.debitUser?.name || refund.debitUser?.phone || '—'}</Text>
              <Text style={styles.accountBalance}>Solde: {Number(refund.debitUser?.balance || 0).toLocaleString()} FCFA</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} style={{ alignSelf: 'center' }} />
            <View style={[styles.accountCard, styles.creditCard]}>
              <Ionicons name="arrow-down-circle" size={20} color="#10B981" />
              <Text style={styles.accountLabel}>À créditer</Text>
              <Text style={styles.accountName}>{refund.creditUser?.name || refund.creditUser?.phone || '—'}</Text>
              <Text style={styles.accountBalance}>Solde: {Number(refund.creditUser?.balance || 0).toLocaleString()} FCFA</Text>
            </View>
          </View>
        </View>

        {/* Fees Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frais</Text>
          <View style={styles.feesRow}>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Frais originaux</Text>
              <Text style={styles.feeValue}>{Number(refund.originalFees).toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Montant remboursé</Text>
              <Text style={[styles.feeValue, { color: Colors.primary, fontWeight: '800' }]}>
                {Number(refund.refundAmount).toLocaleString()} FCFA
              </Text>
            </View>
          </View>
        </View>

        {/* Audit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Traçabilité</Text>
          <InfoRow label="Admin" value={refund.admin?.name || refund.admin?.phone || '—'} icon="shield-outline" />
          <InfoRow label="Réf. originale" value={refund.originalReference || 'N/A'} icon="link-outline" />
        </View>

        {/* Action Buttons */}
        {refund.status === 'PENDING' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.refuseBtn]}
              onPress={handleRefuse}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={handleApprove}
              disabled={actionLoading}
            >
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Approuver</Text>
            </TouchableOpacity>
          </View>
        )}

        {refund.status === 'APPROVED' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.refuseBtn]}
              onPress={handleRefuse}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.executeBtn]}
              onPress={handleExecute}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="play-circle" size={20} color={Colors.white} />
              )}
              <Text style={[styles.actionBtnText, { color: Colors.white }]}>Exécuter</Text>
            </TouchableOpacity>
          </View>
        )}

        {actionLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8,
  },
  label: { fontSize: 12, color: Colors.textMuted, width: 90 },
  value: { fontSize: 13, color: Colors.text, fontWeight: '500', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 12, marginBottom: 16,
  },
  statusText: { fontSize: 16, fontWeight: '700' },
  section: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 6,
  },
  accountsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  accountCard: {
    flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', gap: 4,
  },
  debitCard: { backgroundColor: '#FEF2F2' },
  creditCard: { backgroundColor: '#F0FDF4' },
  accountLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  accountName: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  accountBalance: { fontSize: 10, color: Colors.textSecondary },
  feesRow: { flexDirection: 'row', gap: 12 },
  feeItem: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 10, alignItems: 'center' },
  feeLabel: { fontSize: 10, color: Colors.textMuted },
  feeValue: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 4 },
  actions: {
    flexDirection: 'row', gap: 12, marginTop: 16,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  refuseBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  approveBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  executeBtn: { backgroundColor: Colors.primary },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center',
  },
});
