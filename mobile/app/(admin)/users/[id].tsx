import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminUserDetail, getAdminUserTransactions, suspendUser, reactivateUser } from '../../../src/api/client';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [userRes, txRes] = await Promise.all([
      getAdminUserDetail(id),
      getAdminUserTransactions(id, { limit: 10 }),
    ]);
    setLoading(false);
    if (userRes.data) setUser(userRes.data);
    if (txRes.data?.transactions) setTransactions(txRes.data.transactions);
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSuspend = () => {
    Alert.alert('Suspendre', `Suspendre le compte de ${user?.name || user?.phone} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Suspendre', style: 'destructive',
        onPress: async () => {
          const res = await suspendUser(id!);
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  const handleReactivate = () => {
    Alert.alert('Réactiver', `Réactiver le compte de ${user?.name || user?.phone} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réactiver',
        onPress: async () => {
          const res = await reactivateUser(id!);
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!user) return <View style={styles.center}><Text>Utilisateur non trouvé</Text></View>;

  const statusColor = user.status === 'ACTIVE' ? '#22C55E' : '#EF4444';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.name || user.phone)[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user.name || 'Sans nom'}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
        <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{user.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Rôle" value={user.role} />
        <InfoRow label="Téléphone vérifié" value={user.phoneVerified ? 'Oui' : 'Non'} />
        <InfoRow label="Profil complet" value={user.profileComplete ? 'Oui' : 'Non'} />
        <InfoRow label="Solde" value={`${Number(user.balance).toLocaleString('fr-FR')} F`} />
        <InfoRow label="Inscrit le" value={new Date(user.createdAt).toLocaleDateString('fr-FR')} />
      </View>

      <View style={styles.actionsRow}>
        {user.status === 'ACTIVE' ? (
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
      </View>

      <Text style={styles.sectionTitle}>Appareils</Text>
      {user.devices && user.devices.length > 0 ? (
        user.devices.map((device: any) => (
          <View key={device.id} style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txLabel}>{device.deviceName || device.deviceType || 'Appareil inconnu'}</Text>
              <Text style={styles.txDate}>{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString('fr-FR') : '—'}</Text>
            </View>
            <Text style={styles.txAmount}>{device.ip || '—'}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>Aucun appareil enregistré</Text>
      )}

      <Text style={styles.sectionTitle}>Dernières transactions</Text>
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>Aucune transaction</Text>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: tx.type === 'DEPOSIT' ? '#ECFDF5' : '#FEF2F2' }]}>
              <Ionicons name={tx.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'} size={16} color={tx.type === 'DEPOSIT' ? '#22C55E' : '#EF4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txLabel}>{tx.type} - {tx.status}</Text>
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
    width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  userPhone: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
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
});
