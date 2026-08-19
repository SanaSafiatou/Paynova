import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getAuditLogs } from '../../src/api/client';

const ACTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'USER_SUSPEND', label: 'Suspension' },
  { value: 'USER_REACTIVATE', label: 'Reactivation' },
  { value: 'ADMIN_CREATE', label: 'Création admin' },
  { value: 'SETTINGS_UPDATE', label: 'Paramètres' },
  { value: 'SECURITY_LOGIN', label: 'Connexion' },
  { value: 'SECURITY_LOGOUT', label: 'Déconnexion' },
  { value: 'KYC_VALIDATED', label: 'KYC validé' },
  { value: 'KYC_REJECTED', label: 'KYC rejeté' },
];

const actionLabel = (a: string) =>
  ACTIONS.find((x) => x.value === a)?.label ?? a;

const actionColor = (a: string) => {
  if (a.includes('SUSPEND') || a.includes('REJECT') || a.includes('LOGOUT'))
    return '#EF4444';
  if (a.includes('CREATE') || a.includes('REACTIVATE') || a.includes('VALIDATED'))
    return '#22C55E';
  if (a.includes('UPDATE') || a.includes('SETTINGS')) return '#F59E0B';
  if (a.includes('LOGIN') || a.includes('SECURITY')) return '#3B82F6';
  return '#6B7280';
};

export default function SuperAdminAudit() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(
    async (p = 1, action = actionFilter, from = dateFrom, to = dateTo) => {
      setLoading(true);
      const res = await getAuditLogs({
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
        page: p,
        limit: 20,
      });
      setLoading(false);
      if (res.data) {
        if (p === 1) setLogs(res.data.logs);
        else setLogs((prev) => [...prev, ...res.data!.logs]);
        setHasMore(res.data.pagination.page < res.data.pagination.pages);
      }
    },
    [actionFilter, dateFrom, dateTo],
  );

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      loadData(1);
    }, []),
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal d'audit</Text>
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ACTIONS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterBtn,
                actionFilter === item.value && styles.filterActive,
              ]}
              onPress={() => {
                setActionFilter(item.value);
                setPage(1);
                loadData(1, item.value);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  actionFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <TouchableOpacity
        style={styles.dateToggle}
        onPress={() => setShowDateFilter(!showDateFilter)}
      >
        <Ionicons
          name={showDateFilter ? 'chevron-up' : 'calendar'}
          size={16}
          color={Colors.primary}
        />
        <Text style={styles.dateToggleText}>
          {showDateFilter ? 'Masquer les dates' : 'Filtrer par date'}
        </Text>
      </TouchableOpacity>

      {showDateFilter && (
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Du</Text>
            <TextInput
              style={styles.dateField}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={Colors.textMuted}
              value={dateFrom}
              onChangeText={setDateFrom}
              onSubmitEditing={() => {
                setPage(1);
                loadData(1, actionFilter, dateFrom, dateTo);
              }}
            />
          </View>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Au</Text>
            <TextInput
              style={styles.dateField}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={Colors.textMuted}
              value={dateTo}
              onChangeText={setDateTo}
              onSubmitEditing={() => {
                setPage(1);
                loadData(1, actionFilter, dateFrom, dateTo);
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.dateApplyBtn}
            onPress={() => {
              setPage(1);
              loadData(1, actionFilter, dateFrom, dateTo);
            }}
          >
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {loading && logs.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.actionBadge,
                    { backgroundColor: `${actionColor(item.action)}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionBadgeText,
                      { color: actionColor(item.action) },
                    ]}
                  >
                    {actionLabel(item.action)}
                  </Text>
                </View>
                <Text style={styles.cardDate}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>

              {item.actor && (
                <View style={styles.actorRow}>
                  <Ionicons
                    name="person-circle-outline"
                    size={16}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.actorText}>
                    {item.actor.name || item.actor.phone || 'Inconnu'}
                  </Text>
                </View>
              )}

              {item.target && (
                <View style={styles.targetRow}>
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={14}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.targetText} numberOfLines={2}>
                    {item.target}
                  </Text>
                </View>
              )}

              {item.details && (
                <Text style={styles.detailsText} numberOfLines={3}>
                  {item.details}
                </Text>
              )}
            </View>
          )}
          ListFooterComponent={
            hasMore && logs.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => {
                  const next = page + 1;
                  setPage(next);
                  loadData(next);
                }}
              >
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyText}>Aucun journal d'audit</Text>
              </View>
            ) : null
          }
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
  filters: { marginTop: 4, marginBottom: 8 },
  filterList: { paddingHorizontal: 22, gap: 6 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  dateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 22,
    marginBottom: 8,
  },
  dateToggleText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginHorizontal: 22,
    marginBottom: 10,
  },
  dateInput: { flex: 1 },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dateField: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  dateApplyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  actionBadgeText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 11, color: Colors.textMuted },
  actorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  actorText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  targetText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  detailsText: { fontSize: 12, color: Colors.textMuted, marginTop: 4, lineHeight: 17 },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 48 },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
});
