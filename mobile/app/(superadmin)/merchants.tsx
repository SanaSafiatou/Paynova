import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getSuperAdminMerchants } from '../../src/api/client';

type StatusFilter = 'all' | 'ACTIVE' | 'SUSPENDED';

export default function SuperAdminMerchants() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, q = search, status = statusFilter) => {
    setLoading(p === 1);
    const res = await getSuperAdminMerchants({
      q: q || undefined,
      status: status === 'all' ? undefined : status,
      page: p,
      limit: 20,
    });
    setLoading(false);
    if (res.data) {
      if (p === 1) setMerchants(res.data.merchants);
      else setMerchants((prev) => [...prev, ...res.data!.merchants]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [search, statusFilter]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const handleStatusChange = (s: StatusFilter) => {
    setStatusFilter(s);
    setPage(1);
    loadData(1, search, s);
  };

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'ACTIVE', label: 'Actif' },
    { key: 'SUSPENDED', label: 'Suspendu' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commerçants</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou téléphone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => { setPage(1); loadData(1, search); }}
        />
      </View>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {statusOptions.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.filterPill, statusFilter === s.key && styles.filterPillActive]}
            onPress={() => handleStatusChange(s.key)}
          >
            <Text style={[styles.filterText, statusFilter === s.key && styles.filterTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && merchants.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={merchants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const profile = item.merchantProfile;
            const statusColor = item.status === 'ACTIVE' ? '#22C55E' : '#EF4444';
            return (
              <View
                style={styles.card}
              >
                <View style={styles.avatar}>
                  <Ionicons name="storefront" size={22} color={Colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{profile?.businessName || item.phone}</Text>
                  <Text style={styles.cardSub}>{item.phone}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {item.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            hasMore && merchants.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => { const next = page + 1; setPage(next); loadData(next); }}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Charger plus</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? (
            <Text style={styles.emptyText}>Aucun commerçant trouvé</Text>
          ) : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 22, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 22,
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 22, marginTop: 12 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: Colors.white },
  list: { padding: 22 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    marginBottom: 8, elevation: 2,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: '#FFF7ED',
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
