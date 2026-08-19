import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { formatAmount } from '../../src/utils/format';
import { getMerchantProfile, getMerchantBalance, getMerchantStats, getMerchantSales } from '../../src/api/client';

export default function DashboardScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, b, s, sl] = await Promise.all([
        getMerchantProfile(),
        getMerchantBalance(),
        getMerchantStats('month'),
        getMerchantSales({ page: 1, limit: 5 }),
      ]);
      if (p.data) setProfile(p.data);
      if (b.data) setBalance(b.data);
      if (s.data) setStats(s.data);
      if (sl.data) setRecentSales(sl.data.sales || []);
    } catch (e) {}
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
        <Text style={styles.headerTitle}>PayNova</Text>
        <Text style={styles.headerSub}>Espace Commerçant</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balanceAmount}>{formatAmount(balance?.merchantBalance || 0)}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceCode}>Code: {balance?.merchantCode || '—'}</Text>
          </View>
        </View>

        {/* Today stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="cart" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{stats?.totalSales || 0}</Text>
            <Text style={styles.statLabel}>Ventes ce mois</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={20} color={Colors.success} />
            <Text style={styles.statValue}>{formatAmount(stats?.totalAmount || 0)}</Text>
            <Text style={styles.statLabel}>Total reçu</Text>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(commercant)/qr')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="qr-code" size={22} color="#D97706" />
            </View>
            <Text style={styles.actionLabel}>Mon QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(commercant)/paiements')}>
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="card" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Paiements</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(commercant)/ventes')}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="trending-up" size={22} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Mes ventes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(commercant)/retraits')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="wallet" size={22} color="#DC2626" />
            </View>
            <Text style={styles.actionLabel}>Retrait</Text>
          </TouchableOpacity>
        </View>

        {/* Recent sales */}
        <Text style={styles.sectionTitle}>Dernières ventes</Text>
        {recentSales.length > 0 ? (
          recentSales.map((s: any) => (
            <View key={s.id} style={styles.saleItem}>
              <View style={styles.saleLeft}>
                <Ionicons name="person-circle" size={18} color={Colors.textMuted} />
                <View>
                  <Text style={styles.saleClient}>{s.client?.name || s.client?.phone || 'Client'}</Text>
                  <Text style={styles.saleDate}>{new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
              <Text style={styles.saleAmount}>+{formatAmount(Number(s.amount))}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune vente ce mois</Text>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
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
  balanceCard: {
    backgroundColor: Colors.primaryDark,
    marginHorizontal: 16, marginTop: -8, borderRadius: 16, padding: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  balanceLabel: { fontSize: 13, color: '#DDD6FE' },
  balanceAmount: { fontSize: 28, fontWeight: '800', color: Colors.white, marginTop: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  balanceCode: { fontSize: 12, color: '#A78BFA' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 6 },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12,
  },
  actionCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 12, padding: 16,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, marginTop: 8 },
  saleItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white,
    marginHorizontal: 16, padding: 12, borderRadius: 10, marginBottom: 8,
  },
  saleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  saleClient: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  saleDate: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  saleAmount: { fontSize: 13, fontWeight: '700', color: Colors.success },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginVertical: 20 },
});
