import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminReports, reviewReport } from '../../../src/api/client';

export default function AdminReports() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, status = statusFilter) => {
    setLoading(true);
    const res = await getAdminReports({ status: status || undefined, page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setReports(res.data.reports);
      else setReports((prev) => [...prev, ...res.data!.reports]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [statusFilter]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const handleReview = (reportId: string, status: string) => {
    const labels: Record<string, string> = { RESOLVED: 'Résoudre', DISMISSED: 'Rejeter', REVIEWED: 'Examiner' };
    Alert.alert(labels[status] || status, `Marquer ce signalement comme "${labels[status]}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: labels[status], onPress: async () => {
          const res = await reviewReport(reportId, status);
          if (!res.error) loadData();
          else Alert.alert('Erreur', res.error);
        },
      },
    ]);
  };

  const statuses = ['', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
  const statusLabel = (s: string) => s === '' ? 'Tous' : s === 'PENDING' ? 'En attente' : s === 'REVIEWED' ? 'Examiné' : s === 'RESOLVED' ? 'Résolu' : 'Rejeté';
  const statusColor = (s: string) => s === 'PENDING' ? '#F59E0B' : s === 'RESOLVED' ? '#22C55E' : s === 'DISMISSED' ? '#6B7280' : '#3B82F6';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signalements</Text>
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

      {loading && reports.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text style={styles.reason}>{item.reason}</Text>
              {item.description && <Text style={styles.description}>{item.description}</Text>}
              <View style={styles.cardFooter}>
                <Text style={styles.agentName}>Agent: {item.agent?.name || item.agent?.phone}</Text>
                <Text style={styles.txInfo}>{item.transaction?.type} - {Number(item.transaction?.amount).toLocaleString('fr-FR')} F</Text>
              </View>
              {item.status === 'PENDING' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.resolveBtn} onPress={() => handleReview(item.id, 'RESOLVED')}>
                    <Text style={styles.resolveBtnText}>Résoudre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dismissBtn} onPress={() => handleReview(item.id, 'DISMISSED')}>
                    <Text style={styles.dismissBtnText}>Rejeter</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            hasMore && reports.length > 0 ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => { const next = page + 1; setPage(next); loadData(next); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucun signalement</Text> : null}
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
  reason: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  description: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  agentName: { fontSize: 12, color: Colors.textMuted },
  txInfo: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  resolveBtn: {
    flex: 1, backgroundColor: '#ECFDF5', borderRadius: 10, paddingVertical: 8, alignItems: 'center',
  },
  resolveBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  dismissBtn: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 8, alignItems: 'center',
  },
  dismissBtnText: { color: '#6B7280', fontWeight: '700', fontSize: 13 },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
