import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { formatAmount } from '../../src/utils/format';
import { getMerchantSales } from '../../src/api/client';

export default function PaiementsScreen() {
  const [sales, setSales] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getMerchantSales({ page: 1, limit: 50 });
      if (data.data) setSales(data.data.sales || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paiements reçus</Text>
        <Text style={styles.headerSub}>{sales.length} transaction(s)</Text>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun paiement reçu</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.saleCard}>
            <View style={styles.saleLeft}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.saleClient}>{item.client?.name || item.client?.phone || 'Client'}</Text>
                <Text style={styles.saleDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
            <View style={styles.saleRight}>
              <Text style={styles.saleAmount}>+{formatAmount(Number(item.amount))}</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.statusText, { color: '#059669' }]}>Reçu</Text>
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
    backgroundColor: Colors.primary,
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: '#DDD6FE', marginTop: 2 },
  saleCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  saleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  saleClient: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  saleDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  saleRight: { alignItems: 'flex-end' },
  saleAmount: { fontSize: 14, fontWeight: '700', color: Colors.success },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 12 },
});
