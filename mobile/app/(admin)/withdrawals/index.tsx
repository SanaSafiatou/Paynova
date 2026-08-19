import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getMerchantWithdrawalsAdmin, processMerchantWithdrawal } from '../../../src/api/client';

export default function AdminWithdrawals() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, status = statusFilter) => {
    setLoading(true);
    const res = await getMerchantWithdrawalsAdmin({ page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      const items = res.data.withdrawals ?? [];
      const filtered = status ? items.filter((w: any) => w.status === status) : items;
      if (p === 1) setWithdrawals(filtered);
      else setWithdrawals((prev) => [...prev, ...filtered]);
      setHasMore(res.data.pagination ? res.data.pagination.page < res.data.pagination.pages : false);
    }
  }, [statusFilter]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const handleApprove = (id: string) => {
    Alert.alert('Approuver', 'Voulez-vous vraiment approuver ce retrait ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Approuver',
        onPress: async () => {
          const res = await processMerchantWithdrawal(id, { status: 'APPROUVE' });
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  const handleRefuse = (id: string) => {
    Alert.alert('Refuser', 'Voulez-vous vraiment refuser ce retrait ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: async () => {
          const res = await processMerchantWithdrawal(id, { status: 'REFUSE' });
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  const statuses = ['', 'EN_ATTENTE', 'APPROUVE', 'REFUSE', 'TERMINE'];
  const statusLabel = (s: string) => s === '' ? 'Tous' : s === 'EN_ATTENTE' ? 'En attente' : s === 'APPROUVE' ? 'Approuvé' : s === 'REFUSE' ? 'Refusé' : 'Terminé';
  const statusColor = (s: string) => s === 'EN_ATTENTE' ? '#F59E0B' : s === 'APPROUVE' ? '#3B82F6' : s === 'REFUSE' ? '#EF4444' : '#22C55E';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retraits</Text>
      </View>

      <View style={styles.filters}>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, statusFilter === s && styles.filterActive]}
            onPress={() => { setStatusFilter(s); setPage(1); loadData(1, s); }}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>{statusLabel(s)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && withdrawals.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={withdrawals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text style={styles.merchantName}>{item.merchant?.name || 'Inconnu'} — {item.merchant?.phone || 'N/A'}</Text>
              <Text style={styles.amount}>{Number(item.amount).toLocaleString('fr-FR')} FC</Text>
              {item.note ? <Text style={styles.note}>Note: {item.note}</Text> : null}
              {item.status === 'EN_ATTENTE' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                    <Text style={styles.approveBtnText}>Approuver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.refuseBtn} onPress={() => handleRefuse(item.id)}>
                    <Text style={styles.refuseBtnText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            hasMore && withdrawals.length > 0 ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => { const next = page + 1; setPage(next); loadData(next); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucun retrait</Text> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  filters: { flexDirection: 'row', paddingHorizontal: 22, gap: 6, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  merchantName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  amount: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  note: { fontSize: 12, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveBtn: {
    flex: 1, backgroundColor: '#ECFDF5', borderRadius: 10, paddingVertical: 8, alignItems: 'center',
  },
  approveBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  refuseBtn: {
    flex: 1, backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 8, alignItems: 'center',
  },
  refuseBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
