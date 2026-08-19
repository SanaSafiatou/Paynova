import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getAgentStats } from '../../src/api/client';

export default function AgentStats() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('month');

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [period]),
  );

  const loadStats = async () => {
    const res = await getAgentStats(period);
    if (res.data) setStats(res.data);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text>
      </View>

      <View style={styles.periodFilters}>
        {[
          { key: 'week', label: 'Semaine' },
          { key: 'month', label: 'Mois' },
          { key: 'year', label: 'Année' },
        ].map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#22C55E' }]}>
          <Text style={styles.statLabel}>Dépôts</Text>
          <Text style={styles.statValue}>{stats?.deposits?.count || 0}</Text>
          <Text style={styles.statAmount}>{(stats?.deposits?.total || 0).toLocaleString('fr-FR')} F</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
          <Text style={styles.statLabel}>Retraits</Text>
          <Text style={styles.statValue}>{stats?.withdrawals?.count || 0}</Text>
          <Text style={styles.statAmount}>{(stats?.withdrawals?.total || 0).toLocaleString('fr-FR')} F</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
          <Text style={styles.statLabel}>Opérations totales</Text>
          <Text style={styles.statValue}>{stats?.totalOperations || 0}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statLabel}>Commissions</Text>
          <Text style={styles.statValue}>{(stats?.commissions?.total || 0).toLocaleString('fr-FR')} F</Text>
        </View>
      </View>

      <View style={styles.periodCard}>
        <Ionicons name="calendar" size={18} color={Colors.primary} />
        <Text style={styles.periodInfo}>
          Du {stats?.startDate ? new Date(stats.startDate).toLocaleDateString('fr-FR') : '-'}
          {' '}au{' '}
          {stats?.endDate ? new Date(stats.endDate).toLocaleDateString('fr-FR') : '-'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { paddingBottom: 100 },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  periodFilters: {
    flexDirection: 'row', paddingHorizontal: 22, gap: 8, marginBottom: 16,
  },
  periodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  periodActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: Colors.white },
  statsGrid: {
    flexDirection: 'row', gap: 12, marginHorizontal: 22, marginBottom: 12,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    borderLeftWidth: 4, elevation: 2,
  },
  statLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statAmount: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginTop: 4 },
  periodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 22, marginTop: 8, padding: 14,
    backgroundColor: Colors.white, borderRadius: 12, elevation: 2,
  },
  periodInfo: { fontSize: 13, color: Colors.textSecondary },
});
