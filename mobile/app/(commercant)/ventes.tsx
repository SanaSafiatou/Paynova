import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { formatAmount } from '../../src/utils/format';
import { getMerchantSales } from '../../src/api/client';

export default function VentesScreen() {
  const [sales, setSales] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (p = 1) => {
    try {
      const data = await getMerchantSales({ page: p, limit: 20 });
      if (data.data) {
        if (p === 1) {
          setSales(data.data.sales || []);
        } else {
          setSales((prev) => [...prev, ...(data.data!.sales || [])]);
        }
        setHasMore(p < (data.data.pagination?.pages || 1));
      }
      setPage(p);
    } catch (e) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (hasMore) await load(page + 1);
  };

  const totalVentes = sales.length;
  const totalMontant = sales.reduce((s, v) => s + Number(v.amount), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes ventes</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{totalVentes}</Text>
            <Text style={styles.headerStatLabel}>Ventes</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{formatAmount(totalMontant)}</Text>
            <Text style={styles.headerStatLabel}>Total</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trending-up-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune vente enregistrée</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardRef}>{item.reference || '—'}</Text>
                <Text style={styles.cardClient}>{item.client?.name || item.client?.phone || 'Client'}</Text>
              </View>
              <Text style={styles.cardAmount}>+{formatAmount(Number(item.amount))}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.statusText, { color: '#059669' }]}>Complété</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerStats: {
    flexDirection: 'row', backgroundColor: Colors.primaryDark, borderRadius: 12,
    padding: 14, marginTop: 16, gap: 0,
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: { fontSize: 15, fontWeight: '700', color: Colors.white },
  headerStatLabel: { fontSize: 11, color: '#A78BFA', marginTop: 2 },
  headerDivider: { width: 1, backgroundColor: '#5B21B6', marginVertical: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardRef: { fontSize: 11, color: Colors.textMuted },
  cardClient: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: '700', color: Colors.success },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  cardDate: { fontSize: 11, color: Colors.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 12 },
});
