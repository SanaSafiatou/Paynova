import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminTransactions } from '../../../src/api/client';

export default function AdminTransactions() {
  const router = useRouter();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, q = search, type = typeFilter, status = statusFilter, from = dateFrom, to = dateTo) => {
    setLoading(true);
    const res = await getAdminTransactions({ q: q || undefined, type: type || undefined, status: status || undefined, from: from || undefined, to: to || undefined, page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setTxs(res.data.transactions);
      else setTxs((prev) => [...prev, ...res.data!.transactions]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [search, typeFilter, statusFilter, dateFrom, dateTo]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1, search, typeFilter, statusFilter, dateFrom, dateTo); }, []));

  const types = ['', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT'];
  const statuses = ['', 'SUCCESS', 'PENDING', 'FAILED'];
  const statusLabels: Record<string, string> = { '': 'Tous', SUCCESS: 'Complétée', PENDING: 'En attente', FAILED: 'Échouée' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par ID, référence, téléphone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => { setPage(1); loadData(1, search, typeFilter, statusFilter, dateFrom, dateTo); }}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={types}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, typeFilter === item && styles.filterActive]}
              onPress={() => { setTypeFilter(item); setPage(1); loadData(1, search, item, statusFilter, dateFrom, dateTo); }}
            >
              <Text style={[styles.filterText, typeFilter === item && styles.filterTextActive]}>
                {item === '' ? 'Toutes' : item === 'DEPOSIT' ? 'Dépôts' : item === 'WITHDRAWAL' ? 'Retraits' : item === 'TRANSFER' ? 'Transferts' : 'Paiements'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 6 }}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, statusFilter === item && styles.filterActive]}
              onPress={() => { setStatusFilter(item); setPage(1); loadData(1, search, typeFilter, item, dateFrom, dateTo); }}
            >
              <Text style={[styles.filterText, statusFilter === item && styles.filterTextActive]}>
                {statusLabels[item]}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 6 }}
        />
      </View>

      <View style={styles.dateRow}>
        <TextInput
          style={styles.dateInput}
          placeholder="Du (AAAA-MM-JJ)"
          placeholderTextColor={Colors.textMuted}
          value={dateFrom}
          onChangeText={setDateFrom}
          keyboardType="default"
        />
        <TextInput
          style={styles.dateInput}
          placeholder="Au (AAAA-MM-JJ)"
          placeholderTextColor={Colors.textMuted}
          value={dateTo}
          onChangeText={setDateTo}
          keyboardType="default"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => { setPage(1); loadData(1, search, typeFilter, statusFilter, dateFrom, dateTo); }}
        >
          <Ionicons name="search" size={16} color={Colors.white} />
          <Text style={styles.searchBtnText}>Rechercher</Text>
        </TouchableOpacity>
      </View>

      {loading && txs.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(admin)/transactions/${item.id}` as any)}
            >
              <View style={[styles.cardIcon, { backgroundColor: item.type === 'DEPOSIT' ? '#ECFDF5' : item.type === 'WITHDRAWAL' ? '#FEF2F2' : '#F5F3FF' }]}>
                <Ionicons
                  name={item.type === 'DEPOSIT' ? 'arrow-down' : item.type === 'WITHDRAWAL' ? 'arrow-up' : 'swap-horizontal'}
                  size={16}
                  color={item.type === 'DEPOSIT' ? '#22C55E' : item.type === 'WITHDRAWAL' ? '#EF4444' : Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.type} - {item.status}</Text>
                <Text style={styles.cardSub}>{item.client?.name || item.client?.phone}</Text>
                <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardAmount}>{Number(item.amount).toLocaleString('fr-FR')} F</Text>
                {item.flagged && <Ionicons name="flag" size={14} color="#EF4444" style={{ marginTop: 4 }} />}
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            hasMore && txs.length > 0 ? (
              <TouchableOpacity style={styles.loadMore}               onPress={() => { const next = page + 1; setPage(next); loadData(next, search, typeFilter, statusFilter, dateFrom, dateTo); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucune transaction</Text> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 22,
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filters: { marginTop: 10, marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 22, marginBottom: 8,
  },
  dateInput: {
    flex: 1, fontSize: 12, color: Colors.textPrimary,
    backgroundColor: Colors.white, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 8, elevation: 2,
  },
  cardIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textMuted },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  cardAmount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
