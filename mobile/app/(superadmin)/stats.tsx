import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getSuperStats } from '../../src/api/client';

type Period = 'week' | 'month' | 'year';

function getDateRange(period: Period) {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from: string;
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    from = d.toISOString().split('T')[0];
  } else if (period === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    from = d.toISOString().split('T')[0];
  } else {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    from = d.toISOString().split('T')[0];
  }
  return { from, to };
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function SuperAdminStats() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dateRange = useMemo(() => getDateRange(period), [period]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getSuperStats({ from: dateRange.from, to: dateRange.to });
    setLoading(false);
    if (res.data) setStats(res.data);
  }, [dateRange.from, dateRange.to]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'year', label: 'Année' },
  ];

  const dailyData = stats?.dailyTransactions || [];

  const maxDaily = dailyData.reduce((max: number, d: any) => Math.max(max, d.count || 0), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques globales</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodPill, period === p.key && styles.periodPillActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.dateRange}>
          {formatShortDate(dateRange.from)} - {formatShortDate(dateRange.to)}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Transaction stats */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Transactions</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(stats?.totalTransactions || 0).toLocaleString('fr-FR')}</Text>
                   <Text style={styles.statLabel}>Total opérations</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(stats?.totalAmount || 0).toLocaleString('fr-FR')} F</Text>
                  <Text style={styles.statLabel}>Montant total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(stats?.totalFees || 0).toLocaleString('fr-FR')} F</Text>
                  <Text style={styles.statLabel}>Frais totaux</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    {(stats?.totalCommissions || 0).toLocaleString('fr-FR')} F
                  </Text>
                  <Text style={styles.statLabel}>Commissions</Text>
                </View>
              </View>
            </View>

            {/* User registrations */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Inscriptions utilisateurs</Text>
              <View style={styles.roleGrid}>
                {[
                  { role: 'CLIENT', label: 'Client', icon: 'person', color: '#3B82F6' },
                  { role: 'AGENT', label: 'Agent', icon: 'briefcase', color: '#22C55E' },
                   { role: 'MERCHANT', label: 'Commerçant', icon: 'storefront', color: '#F59E0B' },
                  { role: 'ADMIN', label: 'Admin', icon: 'shield-checkmark', color: '#EF4444' },
                ].map((r) => (
                  <View key={r.role} style={styles.roleItem}>
                    <View style={[styles.roleIcon, { backgroundColor: `${r.color}15` }]}>
                      <Ionicons name={r.icon as any} size={18} color={r.color} />
                    </View>
                    <Text style={styles.roleValue}>{stats?.usersByRole?.[r.role] || 0}</Text>
                    <Text style={styles.roleLabel}>{r.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* New agents & merchants */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Nouveaux</Text>
              <View style={styles.twoCol}>
                <View style={styles.twoColItem}>
                  <View style={[styles.twoColIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="briefcase" size={20} color="#22C55E" />
                  </View>
                  <Text style={styles.twoColValue}>{stats?.newAgents || 0}</Text>
                  <Text style={styles.twoColLabel}>Nouveaux agents</Text>
                </View>
                <View style={styles.twoColItem}>
                  <View style={[styles.twoColIcon, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="storefront" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.twoColValue}>{stats?.newMerchants || 0}</Text>
                  <Text style={styles.twoColLabel}>Nouveaux commerçants</Text>
                </View>
              </View>
            </View>

            {/* Suspensions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Suspensions</Text>
              <View style={styles.suspensionRow}>
                <View style={[styles.suspensionIcon, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="ban" size={20} color="#EF4444" />
                </View>
                <View>
                  <Text style={styles.suspensionValue}>{stats?.suspensions || 0}</Text>
                  <Text style={styles.suspensionLabel}>Comptes suspendus</Text>
                </View>
              </View>
            </View>

            {/* Daily transaction chart */}
            {dailyData.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Transactions journalières</Text>
                <View style={styles.chartArea}>
                  {dailyData.map((day: any, i: number) => {
                    const heightPct = maxDaily > 0 ? (day.count || 0) / maxDaily : 0;
                    return (
                      <View key={i} style={styles.barGroup}>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(heightPct * 120, 4),
                                backgroundColor: heightPct > 0.7 ? Colors.primary : `${Colors.primary}80`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{day.label || ''}</Text>
                        <Text style={styles.barValue}>{day.count || 0}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  scroll: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 22, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  periodRow: { flexDirection: 'row', gap: 8, marginHorizontal: 22 },
  periodPill: {
    flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.white,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  periodPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  periodTextActive: { color: Colors.white },
  dateRange: {
    textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 8, marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, marginHorizontal: 22,
    marginBottom: 12, padding: 16, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { width: '47%' },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  roleGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  roleItem: { alignItems: 'center', flex: 1 },
  roleIcon: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  roleValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  roleLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  twoCol: { flexDirection: 'row', gap: 12 },
  twoColItem: { flex: 1, alignItems: 'center' },
  twoColIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  twoColValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  twoColLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  suspensionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  suspensionIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  suspensionValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  suspensionLabel: { fontSize: 12, color: Colors.textMuted },
  chartArea: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: 160, paddingTop: 8,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barContainer: { height: 120, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 20, borderRadius: 6 },
  barLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4 },
  barValue: { fontSize: 9, fontWeight: '700', color: Colors.textPrimary },
});
