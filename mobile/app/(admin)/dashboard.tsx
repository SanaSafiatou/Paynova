import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import { getAdminDashboard } from '../../src/api/client';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const res = await getAdminDashboard();
    if (res.data) setStats(res.data);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const cards = [
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: 'people', color: '#3B82F6', route: '/(admin)/users' },
    { label: 'Agents', value: stats?.totalAgents || 0, icon: 'briefcase', color: '#22C55E', route: '/(admin)/agents' },
    { label: 'Commerçants', value: stats?.totalMerchants || 0, icon: 'storefront', color: '#F59E0B', route: '/(admin)/merchants' },
    { label: 'Transactions', value: stats?.totalTransactions || 0, icon: 'swap-horizontal', color: Colors.primary, route: '/(admin)/transactions' },
    { label: 'Remboursements', value: 0, icon: 'receipt-outline', color: '#F59E0B', route: '/(admin)/refunds' },
    { label: 'Retraits', value: 0, icon: 'cash-outline', color: '#EF4444', route: '/(admin)/withdrawals' },
    { label: "Journal d'audit", value: 0, icon: 'document-text-outline', color: '#6366F1', route: '/(admin)/audit' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Administration</Text>
          <Text style={styles.name}>PayNova</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Today's stats */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Aujourd'hui</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{stats?.todayStats?.count || 0}</Text>
              <Text style={styles.todayLabel}>Opérations</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{Number(stats?.todayStats?.totalAmount || 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.todayLabel}>Montant (F)</Text>
            </View>
          </View>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: '#22C55E' }]}>{Number(stats?.todayStats?.deposits || 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.todayLabel}>Dépôts</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: '#EF4444' }]}>{Number(stats?.todayStats?.withdrawals || 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.todayLabel}>Retraits</Text>
            </View>
          </View>
        </View>

        {/* Cards grid */}
        <View style={styles.grid}>
          {cards.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={styles.card}
              onPress={() => router.push(c.route as any)}
            >
              <View style={[styles.cardIcon, { backgroundColor: `${c.color}15` }]}>
                <Ionicons name={c.icon as any} size={22} color={c.color} />
              </View>
              <Text style={styles.cardValue}>{c.value.toLocaleString('fr-FR')}</Text>
              <Text style={styles.cardLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reports + Audit shortcuts */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.cardWide}
            onPress={() => router.push('/(admin)/reports')}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="flag" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardValue}>{stats?.pendingReports || 0}</Text>
              <Text style={styles.cardLabel}>Signalements en attente</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cardWide}
            onPress={() => router.push('/(admin)/settings')}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="settings" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Paramètres du système</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Recent transactions */}
        {stats?.recentTransactions?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            {stats.recentTransactions.map((tx: any) => (
              <TouchableOpacity
                key={tx.id}
                style={styles.txRow}
                onPress={() => router.push(`/(admin)/transactions/${tx.id}` as any)}
              >
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'DEPOSIT' ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Ionicons
                    name={tx.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={tx.type === 'DEPOSIT' ? '#22C55E' : '#EF4444'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txLabel}>{tx.type === 'DEPOSIT' ? 'Dépôt' : tx.type === 'WITHDRAWAL' ? 'Retrait' : tx.type}</Text>
                  <Text style={styles.txSub}>{tx.client?.name || tx.client?.phone}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'DEPOSIT' ? '#22C55E' : '#EF4444' }]}>
                  {Number(tx.amount).toLocaleString('fr-FR')} F
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  scroll: { paddingBottom: 100 },
  header: {
    backgroundColor: '#1A1A2E', paddingTop: 52, paddingBottom: 24,
    paddingHorizontal: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.white },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  todayCard: {
    marginHorizontal: 22, marginTop: 16, backgroundColor: Colors.primary,
    borderRadius: 20, padding: 20,
  },
  todayTitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  todayRow: { flexDirection: 'row', gap: 0, marginBottom: 12 },
  todayStat: { flex: 1, alignItems: 'center' },
  todayDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  todayValue: { fontSize: 22, fontWeight: '800', color: Colors.white },
  todayLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 22, marginTop: 12,
  },
  card: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 16, padding: 16, elevation: 2,
  },
  cardWide: {
    width: '100%', backgroundColor: Colors.white, borderRadius: 16, padding: 16, elevation: 2,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cardIcon: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  cardValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  cardLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
    marginHorizontal: 22, marginTop: 24, marginBottom: 10,
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 22, marginBottom: 8, backgroundColor: Colors.white,
    borderRadius: 12, padding: 12, elevation: 2,
  },
  txIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  txLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  txSub: { fontSize: 11, color: Colors.textMuted },
  txAmount: { fontSize: 13, fontWeight: '700' },
});
