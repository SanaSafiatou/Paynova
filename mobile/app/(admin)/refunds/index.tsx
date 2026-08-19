import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getRefunds, getRefundStats } from '../../../src/api/client';

const STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Approuvé' },
  { key: 'COMPLETED', label: 'Terminé' },
  { key: 'REFUSED', label: 'Refusé' },
];

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

export default function AdminRefunds() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    const [res, statsRes] = await Promise.all([
      getRefunds({ status: statusFilter || undefined, q: search || undefined, page: p, limit: 20 }),
      p === 1 ? getRefundStats() : Promise.resolve(null),
    ]);
    setLoading(false);
    if (res.data) {
      const items = res.data.refunds ?? [];
      if (p === 1) {
        setRefunds(items);
        setPage(1);
      } else {
        setRefunds((prev) => [...prev, ...items]);
      }
      setHasMore(res.data.pagination ? res.data.pagination.page < res.data.pagination.pages : false);
      setPage(p);
    }
    if (statsRes?.data) setStats(statsRes.data);
  }, [statusFilter, search]);

  useFocusEffect(
    useCallback(() => {
      loadData(1);
    }, [loadData])
  );

  const renderStatCard = () => {
    if (!stats) return null;
    return (
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.statNumber, { color: '#2563EB' }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approuvé</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Terminé</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(admin)/refunds/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardRef}>
          <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
          <Text style={styles.refText} numberOfLines={1}>{item.refundReference}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>{Number(item.refundAmount).toLocaleString()} FCFA</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="swap-horizontal-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.debitUser?.phone || '—'} → {item.creditUser?.phone || '—'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          {item.admin?.name || item.admin?.phone || 'Admin'}
        </Text>
        <Text style={styles.footerText}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Remboursements</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(admin)/refunds/new')}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {renderStatCard()}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une référence..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadData(1)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setTimeout(() => loadData(1), 100); }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
              onPress={() => setStatusFilter(item.key)}
            >
              <Text style={[styles.filterChipText, statusFilter === item.key && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={refunds}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={() => { if (hasMore && !loading) loadData(page + 1); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} /> : null}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun remboursement</Text>
          </View>
        ) : null}
        contentContainerStyle={styles.listContent}
      />
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
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  addButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8,
  },
  statCard: {
    flex: 1, borderRadius: 12, padding: 12, alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 12, paddingHorizontal: 12, marginHorizontal: 16, marginTop: 12,
    height: 42,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.text },
  filterRow: { paddingHorizontal: 16, paddingTop: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, marginRight: 8, borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: Colors.white },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  cardRef: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  refText: { fontSize: 13, fontWeight: '700', color: Colors.primary, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  reasonText: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  cardDetails: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: Colors.textSecondary },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1,
    borderTopColor: Colors.border, paddingTop: 8,
  },
  footerText: { fontSize: 10, color: Colors.textMuted },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
});
