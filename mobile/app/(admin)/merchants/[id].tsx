import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminUserDetail, getAdminMerchantPayments, suspendMerchant, reactivateMerchant, validateMerchant } from '../../../src/api/client';

export default function MerchantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [merchantRes, paymentsRes] = await Promise.all([
      getAdminUserDetail(id),
      getAdminMerchantPayments(id, { limit: 20 }),
    ]);
    setLoading(false);
    if (merchantRes.data) setMerchant(merchantRes.data);
    if (paymentsRes.data?.transactions) setPayments(paymentsRes.data.transactions);
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSuspend = () => {
    const name = merchant?.merchantProfile?.businessName || merchant?.name || merchant?.phone;
    Alert.alert('Suspendre', `Suspendre le compte de ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Suspendre', style: 'destructive',
        onPress: async () => {
          const res = await suspendMerchant(id!);
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  const handleReactivate = () => {
    const name = merchant?.merchantProfile?.businessName || merchant?.name || merchant?.phone;
    Alert.alert('Réactiver', `Réactiver le compte de ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réactiver',
        onPress: async () => {
          const res = await reactivateMerchant(id!);
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  const handleValidate = () => {
    Alert.alert('Valider', 'Valider ce commerçant ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Valider',
        onPress: async () => {
          const res = await validateMerchant(id!);
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!merchant) return <View style={styles.center}><Text>Commerçant non trouvé</Text></View>;

  const profile = merchant.merchantProfile;
  const validated = profile?.validated;
  const statusColor = merchant.status === 'ACTIVE' ? '#22C55E' : '#EF4444';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="storefront" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.merchantName}>{profile?.businessName || 'Sans nom'}</Text>
        <Text style={styles.merchantPhone}>{merchant.phone}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{merchant.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}</Text>
          </View>
          {validated ? (
            <View style={[styles.badge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.badgeText, { color: '#22C55E' }]}>Validé</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: '#FFF7ED' }]}>
              <Text style={[styles.badgeText, { color: '#F59E0B' }]}>En attente</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Nom commercial" value={profile?.businessName || '—'} />
        <InfoRow label="Type d'activité" value={profile?.businessType || '—'} />
        <InfoRow label="Code marchand" value={profile?.merchantCode || '—'} />
        <InfoRow label="Téléphone" value={merchant.phone} />
        <InfoRow label="Solde" value={`${Number(merchant.balance).toLocaleString('fr-FR')} F`} />
        <InfoRow label="Validé" value={validated ? 'Oui' : 'Non'} />
        <InfoRow label="Inscrit le" value={new Date(merchant.createdAt).toLocaleDateString('fr-FR')} />
      </View>

      {payments.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{payments.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{payments.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0).toLocaleString('fr-FR')} F</Text>
            <Text style={styles.statLabel}>Volume total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(payments.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0) / payments.length).toLocaleString('fr-FR')} F</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        {merchant.status === 'ACTIVE' ? (
          <TouchableOpacity style={styles.dangerBtn} onPress={handleSuspend}>
            <Ionicons name="ban" size={18} color="#EF4444" />
            <Text style={styles.dangerBtnText}>Suspendre</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.successBtn} onPress={handleReactivate}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.successBtnText}>Réactiver</Text>
          </TouchableOpacity>
        )}
        {!validated && (
          <TouchableOpacity style={styles.validateBtn} onPress={handleValidate}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
            <Text style={styles.validateBtnText}>Valider</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Derniers paiements</Text>
      {payments.length === 0 ? (
        <Text style={styles.emptyText}>Aucun paiement</Text>
      ) : (
        payments.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: tx.type === 'DEPOSIT' ? '#ECFDF5' : '#FEF2F2' }]}>
              <Ionicons name={tx.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'} size={16} color={tx.type === 'DEPOSIT' ? '#22C55E' : '#EF4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txLabel}>{tx.clientName || 'Client inconnu'}</Text>
              <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</Text>
            </View>
            <Text style={styles.txAmount}>{Number(tx.amount).toLocaleString('fr-FR')} F</Text>
          </View>
        ))
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: 14, color: Colors.textMuted },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { padding: 22, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  profileCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 2,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFF7ED',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  merchantName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  merchantPhone: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 12, elevation: 2,
  },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  dangerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 12,
  },
  dangerBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  successBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#ECFDF5', borderRadius: 12, paddingVertical: 12,
  },
  successBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 14 },
  validateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: `${Colors.primary}15`, borderRadius: 12, paddingVertical: 12,
  },
  validateBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white,
    borderRadius: 12, padding: 12, marginBottom: 6, elevation: 1,
  },
  txIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  txLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  txDate: { fontSize: 11, color: Colors.textMuted },
  txAmount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
});
