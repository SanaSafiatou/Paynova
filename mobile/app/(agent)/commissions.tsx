import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getAgentCommissions } from '../../src/api/client';

export default function AgentCommissions() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    setLoading(true);
    const res = await getAgentCommissions();
    setLoading(false);
    if (res.data) {
      setCommissions(res.data.commissions);
      setTotal(res.data.total);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes commissions</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total des commissions</Text>
        <Text style={styles.totalValue}>{total.toLocaleString('fr-FR')} F CFA</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={commissions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <Ionicons name="cash" size={18} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.itemTitle}>
                    {item.transaction?.type === 'DEPOSIT' ? 'Dépôt' : 'Retrait'}
                  </Text>
                  <Text style={styles.itemDate}>{formatDate(item.calculatedAt)}</Text>
                </View>
              </View>
              <Text style={styles.itemAmount}>+{item.amount.toLocaleString('fr-FR')} F</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune commission</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  totalCard: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 20,
    marginHorizontal: 22, marginBottom: 16,
  },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  totalValue: { fontSize: 28, fontWeight: '800', color: Colors.white, marginTop: 4 },
  list: { padding: 22 },
  itemCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, elevation: 2,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
