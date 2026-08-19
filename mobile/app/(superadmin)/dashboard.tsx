import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import { getSuperAdminDashboard } from '../../src/api/client';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const res = await getSuperAdminDashboard();
    if (res.data) setStats(res.data);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const statCards = [
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: 'people', color: '#3B82F6' },
    { label: 'Agents', value: stats?.totalAgents || 0, icon: 'briefcase', color: '#22C55E' },
    { label: 'Commerçants', value: stats?.totalMerchants || 0, icon: 'storefront', color: '#F59E0B' },
    { label: 'Admins', value: stats?.totalAdmins || 0, icon: 'shield-checkmark', color: Colors.primary },
    { label: 'Transactions', value: stats?.totalTransactions || 0, icon: 'swap-horizontal', color: '#06B6D4' },
  ];

  const todayStats = stats?.todayStats || {};
  const quickInfo = stats?.quickInfo || {};
  const recentAudit = stats?.recentAuditLogs || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Super Admin</Text>
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
        {/* Stat cards */}
        <View style={styles.grid}>
          {statCards.map((c) => (
            <View key={c.label} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: `${c.color}15` }]}>
                <Ionicons name={c.icon as any} size={20} color={c.color} />
              </View>
              <Text style={styles.cardValue}>{c.value.toLocaleString('fr-FR')}</Text>
              <Text style={styles.cardLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's stats */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Aujourd'hui</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{todayStats.count || 0}</Text>
              <Text style={styles.todayLabel}>Opérations</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{(todayStats.totalAmount || 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.todayLabel}>Montant (F)</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{(todayStats.fees || 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.todayLabel}>Frais</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{(todayStats.commissions || 0).toLocaleString('fr-FR')}</Text>
              <Text style={styles.todayLabel}>Commissions</Text>
            </View>
          </View>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: '#22C55E' }]}>{todayStats.deposits || 0}</Text>
              <Text style={styles.todayLabel}>Dépôts</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: '#EF4444' }]}>{todayStats.withdrawals || 0}</Text>
              <Text style={styles.todayLabel}>Retraits</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: '#3B82F6' }]}>{todayStats.transfers || 0}</Text>
              <Text style={styles.todayLabel}>Transferts</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: '#F59E0B' }]}>{todayStats.payments || 0}</Text>
              <Text style={styles.todayLabel}>Paiements</Text>
            </View>
          </View>
        </View>

        {/* Quick info */}
        <Text style={styles.sectionTitle}>Informations rapides</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons name="people" size={18} color="#3B82F6" />
            <Text style={styles.infoValue}>{quickInfo.activeAdmins || 0}</Text>
            <Text style={styles.infoLabel}>Admins actifs</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="flag" size={18} color="#EF4444" />
            <Text style={styles.infoValue}>{quickInfo.pendingReports || 0}</Text>
            <Text style={styles.infoLabel}>Signalements en attente</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="key" size={18} color="#22C55E" />
            <Text style={styles.infoValue}>{quickInfo.activeSessions || 0}</Text>
            <Text style={styles.infoLabel}>Sessions actives</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="alert-circle" size={18} color="#F59E0B" />
            <Text style={styles.infoValue}>{quickInfo.securityEventsToday || 0}</Text>
            <Text style={styles.infoLabel}>Événements sécurité</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="keypad" size={18} color={Colors.primary} />
            <Text style={styles.infoValue}>{quickInfo.activeApiConfigs || 0}</Text>
            <Text style={styles.infoLabel}>Configs API actives</Text>
          </View>
        </View>

        {/* Recent audit logs */}
        {recentAudit.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Journal d'audit récent</Text>
            {recentAudit.map((log: any) => (
              <View key={log.id} style={styles.auditRow}>
                <View style={styles.auditIcon}>
                  <Ionicons name="document-text" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditAction}>
                    {log.actor?.name || 'Système'}
                  </Text>
                  <Text style={styles.auditTarget}>
                    {log.action} {log.targetType ? `(${log.targetType})` : ''}
                  </Text>
                  <Text style={styles.auditDate}>
                    {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
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
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 22, marginTop: 16,
  },
  card: {
    width: '30%', backgroundColor: Colors.white, borderRadius: 14, padding: 12, elevation: 2,
  },
  cardIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  cardValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  cardLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  todayCard: {
    marginHorizontal: 22, marginTop: 16, backgroundColor: Colors.primary,
    borderRadius: 20, padding: 20,
  },
  todayTitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  todayRow: { flexDirection: 'row', gap: 0, marginBottom: 12 },
  todayStat: { flex: 1, alignItems: 'center' },
  todayDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  todayValue: { fontSize: 18, fontWeight: '800', color: Colors.white },
  todayLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary,
    marginHorizontal: 22, marginTop: 24, marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 22,
  },
  infoCard: {
    width: '30%', backgroundColor: Colors.white, borderRadius: 12, padding: 12,
    elevation: 2, alignItems: 'center', gap: 4,
  },
  infoValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  infoLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  auditRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 22, marginBottom: 8, backgroundColor: Colors.white,
    borderRadius: 12, padding: 12, elevation: 2,
  },
  auditIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F3FF',
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  auditAction: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  auditTarget: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  auditDate: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
});
