import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getSuperAdminTransactions } from '../../src/api/client';

const TYPES = [
  { value: '', label: 'Toutes' },
  { value: 'DEPOSIT', label: 'Dépôts' },
  { value: 'WITHDRAWAL', label: 'Retraits' },
  { value: 'TRANSFER', label: 'Transferts' },
  { value: 'PAYMENT', label: 'Paiements' },
];

const typeLabel = (t: string) => TYPES.find((x) => x.value === t)?.label ?? t;

const typeIcon = (t: string) =>
  t === 'DEPOSIT'
    ? ('arrow-down' as const)
    : t === 'WITHDRAWAL'
      ? ('arrow-up' as const)
      : t === 'TRANSFER'
        ? ('swap-horizontal' as const)
        : ('card' as const);

const typeBg = (t: string) =>
  t === 'DEPOSIT'
    ? '#ECFDF5'
    : t === 'WITHDRAWAL'
      ? '#FEF2F2'
      : t === 'TRANSFER'
        ? '#F5F3FF'
        : t === 'PAYMENT'
          ? '#FFF7ED'
          : '#F3F4F6';

const typeColor = (t: string) =>
  t === 'DEPOSIT'
    ? '#22C55E'
    : t === 'WITHDRAWAL'
      ? '#EF4444'
      : t === 'TRANSFER'
        ? '#7C3AED'
        : t === 'PAYMENT'
          ? '#D97706'
          : '#6B7280';

const statusColor = (s: string) =>
  s === 'COMPLETED'
    ? '#22C55E'
    : s === 'PENDING'
      ? '#F59E0B'
      : s === 'FAILED'
        ? '#EF4444'
        : '#6B7280';

const statusLabel = (s: string) =>
  s === 'COMPLETED'
    ? 'Complétée'
    : s === 'PENDING'
      ? 'En attente'
      : s === 'FAILED'
        ? 'Échouée'
        : s;

export default function SuperAdminTransactions() {
  const router = useRouter();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(
    async (p = 1, q = search, type = typeFilter) => {
      setLoading(true);
      const res = await getSuperAdminTransactions({
        q: q || undefined,
        type: type || undefined,
        page: p,
        limit: 20,
      });
      setLoading(false);
      if (res.data) {
        if (p === 1) setTxs(res.data.transactions);
        else setTxs((prev) => [...prev, ...res.data!.transactions]);
        setHasMore(res.data.pagination.page < res.data.pagination.pages);
      }
    },
    [search, typeFilter],
  );

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      loadData(1);
    }, []),
  );

  const formatAmount = (a: number) =>
    Number(a || 0).toLocaleString('fr-FR') + ' F';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par ID, reference, telephone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            setPage(1);
            loadData(1, search);
          }}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TYPES}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterBtn,
                typeFilter === item.value && styles.filterActive,
              ]}
              onPress={() => {
                setTypeFilter(item.value);
                setPage(1);
                loadData(1, search, item.value);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  typeFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {loading && txs.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={styles.card}
            >
              <View style={[styles.cardIcon, { backgroundColor: typeBg(item.type) }]}>
                <Ionicons
                  name={typeIcon(item.type)}
                  size={16}
                  color={typeColor(item.type)}
                />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardType}>{typeLabel(item.type)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColor(item.status)}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: statusColor(item.status) },
                      ]}
                    >
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardClient}>
                  {item.client?.name || item.client?.phone || 'Inconnu'}
                </Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>{formatAmount(item.amount)}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            hasMore && txs.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => {
                  const next = page + 1;
                  setPage(next);
                  loadData(next);
                }}
              >
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="receipt-outline"
                  size={48}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyText}>Aucune transaction trouvée</Text>
              </View>
            ) : null
          }
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 22,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filters: { marginTop: 10, marginBottom: 8 },
  filterList: { paddingHorizontal: 22, gap: 6 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardType: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  cardClient: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  cardRight: { alignItems: 'flex-end' },
  cardAmount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 48 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 12, fontSize: 14 },
});
