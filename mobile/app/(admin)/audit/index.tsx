import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAuditLogs } from '../../../src/api/client';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  REGISTER: 'Inscription',
  CREATE_ADMIN: 'Création admin',
  UPDATE_SETTINGS: 'Modification paramètres',
  VALIDATE_AGENT: 'Validation agent',
  SUSPEND_USER: 'Suspension utilisateur',
  WITHDRAWAL_APPROVE: 'Approbation retrait',
  WITHDRAWAL_REFUSE: 'Refus retrait',
  PAYMENT: 'Paiement',
};

const ACTION_CHIPS = ['', 'LOGIN', 'LOGOUT', 'REGISTER', 'UPDATE_SETTINGS', 'VALIDATE_AGENT', 'SUSPEND_USER', 'PAYMENT', 'WITHDRAWAL_APPROVE', 'WITHDRAWAL_REFUSE'];

const chipLabel = (a: string) => {
  if (a === '') return 'Tous';
  return ACTION_LABELS[a] || a;
};

export default function AuditLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, action = actionFilter, fromDate = from, toDate = to) => {
    setLoading(true);
    const res = await getAuditLogs({
      action: action || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      page: p,
      limit: 20,
    });
    setLoading(false);
    if (res.data) {
      if (p === 1) setLogs(res.data.logs);
      else setLogs((prev) => [...prev, ...res.data!.logs]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [actionFilter, from, to]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const applyDateFilter = (type: 'from' | 'to', value: string) => {
    if (type === 'from') setFrom(value);
    else setTo(value);
  };

  const handleDateSubmit = () => {
    setPage(1);
    loadData(1, actionFilter, from, to);
  };

  const renderLog = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>{ACTION_LABELS[item.action] || item.action}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <Text style={styles.actor}>{item.actor?.name || item.actor?.phone || 'Système'}</Text>
      {item.targetType && <Text style={styles.target}>Cible: {item.targetType}{item.targetId ? ` (${item.targetId.slice(0, 8)}…)` : ''}</Text>}
      {item.details && (
        <Text style={styles.details} numberOfLines={2}>
          {typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal d'audit</Text>
      </View>

      <View style={styles.filters}>
        <View style={styles.chipsRow}>
          {ACTION_CHIPS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.filterBtn, actionFilter === a && styles.filterActive]}
              onPress={() => { setActionFilter(a); setPage(1); loadData(1, a); }}
            >
              <Text style={[styles.filterText, actionFilter === a && styles.filterTextActive]}>{chipLabel(a)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={Colors.textMuted}
            value={from}
            onChangeText={(v) => applyDateFilter('from', v)}
            onSubmitEditing={handleDateSubmit}
            returnKeyType="done"
          />
          <Text style={styles.dateSep}>à</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={Colors.textMuted}
            value={to}
            onChangeText={(v) => applyDateFilter('to', v)}
            onSubmitEditing={handleDateSubmit}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.dateBtn} onPress={handleDateSubmit}>
            <Ionicons name="search" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && logs.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderLog}
          ListFooterComponent={
            hasMore && logs.length > 0 ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => { const next = page + 1; setPage(next); loadData(next); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucune activité enregistrée</Text> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  filters: { paddingHorizontal: 22, marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: {
    flex: 1, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13,
    color: Colors.textPrimary,
  },
  dateSep: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  dateBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, padding: 8,
  },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  actionBadge: {
    backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  actionBadgeText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  dateText: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  actor: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  target: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  details: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
