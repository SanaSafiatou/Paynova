import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getAgentHistory } from '../../src/api/client';

export default function AgentHistorique() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, type = filter) => {
    setLoading(true);
    const res = await getAgentHistory({ page: p, limit: 20, type: type || undefined });
    setLoading(false);
    if (res.data) {
      if (p === 1) {
        setTransactions(res.data.transactions);
      } else {
        setTransactions((prev) => [...prev, ...res.data!.transactions]);
      }
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      loadData(1);
    }, [filter]),
  );

  const handleFilter = (type: string) => {
    setFilter(filter === type ? '' : type);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <View style={[styles.itemIcon, { backgroundColor: item.type === 'DEPOSIT' ? '#ECFDF5' : '#FEF2F2' }]}>
          <Ionicons
            name={item.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'}
            size={18}
            color={item.type === 'DEPOSIT' ? '#22C55E' : '#EF4444'}
          />
        </View>
        <View>
          <Text style={styles.itemTitle}>
            {item.type === 'DEPOSIT' ? 'Dépôt' : 'Retrait'}
          </Text>
          <Text style={styles.itemSubtitle}>{item.client?.name || item.client?.phone}</Text>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemAmount, { color: item.type === 'DEPOSIT' ? '#22C55E' : '#EF4444' }]}>
          {item.type === 'DEPOSIT' ? '+' : '-'}{item.amount.toLocaleString('fr-FR')} F
        </Text>
        <Text style={[styles.itemStatus, {
          color: item.status === 'COMPLETED' ? '#22C55E' : item.status === 'FAILED' ? '#EF4444' : '#F59E0B',
        }]}>
          {item.status === 'COMPLETED' ? 'Terminé' : item.status === 'FAILED' ? 'Échoué' : 'En attente'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
      </View>

      <View style={styles.filters}>
        {['DEPOSIT', 'WITHDRAWAL'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterBtn, filter === type && styles.filterActive]}
            onPress={() => handleFilter(type)}
          >
            <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
              {type === 'DEPOSIT' ? 'Dépôts' : 'Retraits'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && transactions.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune opération trouvée</Text>
          }
          ListFooterComponent={
            hasMore && transactions.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => { setPage((p) => p + 1); loadData(page + 1); }}
              >
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  filters: { flexDirection: 'row', paddingHorizontal: 22, gap: 8, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { padding: 22 },
  itemCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, elevation: 2,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemSubtitle: { fontSize: 12, color: Colors.textMuted },
  itemDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 14, fontWeight: '700' },
  itemStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
