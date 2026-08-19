import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { formatAmount } from '../../src/utils/format';
import { getMerchantHistory } from '../../src/api/client';

export default function HistoriqueScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (p = 1) => {
    try {
      const data = await getMerchantHistory({ page: p, limit: 20 });
      if (data.data) {
        if (p === 1) {
          setTransactions(data.data.transactions || []);
        } else {
          setTransactions((prev) => [...prev, ...(data.data!.transactions || [])]);
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return { name: 'card', color: Colors.success, bg: '#D1FAE5' };
      case 'DEPOSIT': return { name: 'add-circle', color: '#059669', bg: '#D1FAE5' };
      case 'WITHDRAWAL': return { name: 'remove-circle', color: Colors.error, bg: '#FEE2E2' };
      case 'TRANSFER': return { name: 'swap-horizontal', color: '#2563EB', bg: '#DBEAFE' };
      default: return { name: 'ellipse', color: Colors.textMuted, bg: '#F3F4F6' };
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'Paiement reçu';
      case 'DEPOSIT': return 'Dépôt';
      case 'WITHDRAWAL': return 'Retrait';
      case 'TRANSFER': return 'Transfert';
      default: return type;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerSub}>{transactions.length} transaction(s)</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        }
        renderItem={({ item }) => {
          const icon = getIcon(item.type);
          const isCredit = item.isCredit;
          return (
            <View style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name as any} size={18} color={icon.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardType}>{getLabel(item.type)}</Text>
                <Text style={styles.cardDesc}>{item.description || '—'}</Text>
                <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={[styles.cardAmount, { color: isCredit ? Colors.success : Colors.error }]}>
                {isCredit ? '+' : '-'}{formatAmount(Number(item.amount))}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: '#DDD6FE', marginTop: 2 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: 12 },
  cardType: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  cardDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  cardDate: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  cardAmount: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 12 },
});
