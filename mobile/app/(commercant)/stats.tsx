import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { formatAmount } from '../../src/utils/format';
import { getMerchantStats } from '../../src/api/client';

export default function StatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMerchantStats(period);
      if (data.data) setStats(data.data);
    } catch (e) {}
  }, [period]);

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

  const periods = [
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'year', label: 'Année' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={styles.periodTabs}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodTab, period === p.key && styles.periodTabActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodTabText, period === p.key && styles.periodTabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {stats && (
          <>
            {/* KPIs */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Ionicons name="cart" size={22} color={Colors.primary} />
                <Text style={styles.kpiValue}>{stats.totalSales}</Text>
                <Text style={styles.kpiLabel}>Ventes</Text>
              </View>
              <View style={styles.kpiCard}>
                <Ionicons name="cash" size={22} color={Colors.success} />
                <Text style={styles.kpiValue}>{formatAmount(stats.totalAmount)}</Text>
                <Text style={styles.kpiLabel}>Montant total</Text>
              </View>
              <View style={styles.kpiCard}>
                <Ionicons name="remove-circle" size={22} color={Colors.error} />
                <Text style={styles.kpiValue}>{formatAmount(stats.totalFees)}</Text>
                <Text style={styles.kpiLabel}>Frais</Text>
              </View>
              <View style={styles.kpiCard}>
                <Ionicons name="trending-up" size={22} color="#2563EB" />
                <Text style={styles.kpiValue}>{formatAmount(stats.netAmount)}</Text>
                <Text style={styles.kpiLabel}>Net reçu</Text>
              </View>
            </View>

            {/* Daily average */}
            <View style={styles.avgCard}>
              <Ionicons name="speedometer" size={20} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.avgLabel}>Moyenne journalière</Text>
                <Text style={styles.avgValue}>{formatAmount(stats.averageDaily)}</Text>
              </View>
            </View>

            {/* Daily breakdown */}
            {stats.dailySales && stats.dailySales.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Détail par jour</Text>
                {stats.dailySales.map((d: any, i: number) => (
                  <View key={i} style={styles.dayCard}>
                    <Text style={styles.dayDate}>{new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                    <View style={styles.dayStats}>
                      <Text style={styles.dayCount}>{d.count} vente(s)</Text>
                      <Text style={styles.dayTotal}>{formatAmount(Number(d.total))}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {stats.dailySales?.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Aucune donnée pour cette période</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  periodTabs: {
    flexDirection: 'row', backgroundColor: Colors.primaryDark, borderRadius: 10,
    padding: 3, marginTop: 12,
  },
  periodTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  periodTabActive: { backgroundColor: Colors.white },
  periodTabText: { fontSize: 12, fontWeight: '600', color: '#A78BFA' },
  periodTabTextActive: { color: Colors.primaryDark },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '48%', backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  kpiValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 6 },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  avgCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 12, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  avgLabel: { fontSize: 12, color: Colors.textMuted },
  avgValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 24, marginBottom: 12,
  },
  dayCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 10, padding: 12, marginBottom: 8,
  },
  dayDate: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  dayStats: { alignItems: 'flex-end' },
  dayCount: { fontSize: 11, color: Colors.textMuted },
  dayTotal: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 12 },
});
