import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import { getAgentStats, getNotifications } from '../../src/api/client';

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, notifRes] = await Promise.all([
        getAgentStats('month'),
        getNotifications({ unread: true }),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (Array.isArray(notifRes.data)) setUnreadCount(notifRes.data.length);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Agent PayNova</Text>
            <Text style={styles.name}>{user?.name || user?.phone || 'Agent'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(agent)/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="arrow-down" size={20} color="#22C55E" />
            </View>
            <Text style={styles.statValue}>{stats?.deposits?.count || 0}</Text>
            <Text style={styles.statLabel}>Dépôts</Text>
            <Text style={styles.statAmount}>{(stats?.deposits?.total || 0).toLocaleString('fr-FR')} F</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="arrow-up" size={20} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{stats?.withdrawals?.count || 0}</Text>
            <Text style={styles.statLabel}>Retraits</Text>
            <Text style={styles.statAmount}>{(stats?.withdrawals?.total || 0).toLocaleString('fr-FR')} F</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.totalOperations || 0}</Text>
            <Text style={styles.statLabel}>Opérations</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="trending-up" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{(stats?.commissions?.total || 0).toLocaleString('fr-FR')}</Text>
            <Text style={styles.statLabel}>Commissions (F)</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(agent)/operations/deposit')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cash-outline" size={24} color="#22C55E" />
            </View>
            <Text style={styles.actionLabel}>Dépôt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(agent)/operations/withdrawal')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="wallet-outline" size={24} color="#EF4444" />
            </View>
            <Text style={styles.actionLabel}>Retrait</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(agent)/scanner')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="scan" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  scroll: { paddingBottom: 100 },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 24,
    paddingHorizontal: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '700', color: Colors.white },
  notifBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row', gap: 12, marginHorizontal: 22, marginTop: 16,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 16, elevation: 2,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statAmount: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginTop: 4 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
    marginHorizontal: 22, marginTop: 24, marginBottom: 12,
  },
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 22 },
  actionBtn: {
    flex: 1, alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 16, padding: 16, elevation: 2,
  },
  actionIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
});
