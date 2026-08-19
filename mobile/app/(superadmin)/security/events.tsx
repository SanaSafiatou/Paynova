import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getSuperSecurityEvents } from '../../../src/api/client';

export default function SecurityEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, severity = severityFilter) => {
    setLoading(true);
    const res = await getSuperSecurityEvents({ severity: severity || undefined, page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setEvents(res.data.events);
      else setEvents((prev) => [...prev, ...res.data!.events]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [severityFilter]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const severityOptions = ['', 'INFO', 'WARNING', 'CRITICAL'];
  const severityLabel = (s: string) => s === '' ? 'Tous' : s === 'INFO' ? 'Info' : s === 'WARNING' ? 'Avertissement' : 'Critique';
  const severityColor = (s: string) => s === 'CRITICAL' ? '#EF4444' : s === 'WARNING' ? '#F59E0B' : '#22C55E';

  const handleFilter = (sev: string) => {
    setSeverityFilter(sev);
    setPage(1);
    loadData(1, sev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Événements de sécurité</Text>
      </View>

      <View style={styles.filters}>
        {severityOptions.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, severityFilter === s && styles.filterActive]}
            onPress={() => handleFilter(s)}
          >
            {s !== '' && <View style={[styles.severityDot, { backgroundColor: severityColor(s) }]} />}
            <Text style={[styles.filterText, severityFilter === s && styles.filterTextActive]}>
              {severityLabel(s)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && events.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.severityBadge, { backgroundColor: severityColor(item.severity) + '20' }]}>
                  <Ionicons
                    name={item.severity === 'CRITICAL' ? 'warning' : item.severity === 'WARNING' ? 'alert-circle' : 'information-circle'}
                    size={14}
                    color={severityColor(item.severity)}
                  />
                  <Text style={[styles.severityText, { color: severityColor(item.severity) }]}>
                    {severityLabel(item.severity)}
                  </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text style={styles.eventType}>{item.eventType || item.type || 'Événement'}</Text>
              {item.userId && <Text style={styles.metaLine}>Utilisateur: {item.userId}</Text>}
              {item.ip && <Text style={styles.metaLine}>IP: {item.ip}</Text>}
              {item.details && <Text style={styles.details}>{typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}</Text>}
            </View>
          )}
          ListFooterComponent={
            hasMore && events.length > 0 ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => { setPage((p) => p + 1); loadData(page + 1); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucun événement de sécurité</Text> : null}
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
  filters: { flexDirection: 'row', paddingHorizontal: 22, gap: 6, marginBottom: 12 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  severityDot: { width: 7, height: 7, borderRadius: 4 },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  severityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  severityText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dateText: { fontSize: 11, color: Colors.textMuted },
  eventType: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  metaLine: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  details: { fontSize: 12, color: Colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
