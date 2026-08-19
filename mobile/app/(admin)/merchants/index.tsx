import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminMerchants, suspendMerchant, reactivateMerchant, validateMerchant } from '../../../src/api/client';

export default function AdminMerchants() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, q = search, status = statusFilter) => {
    setLoading(true);
    const res = await getAdminMerchants({ q: q || undefined, status: status || undefined, page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setMerchants(res.data.merchants);
      else setMerchants((prev) => [...prev, ...res.data!.merchants]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [search, statusFilter]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const handleValidate = (userId: string) => {
    Alert.alert('Valider commerçant', 'Valider ce commerçant ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider', onPress: async () => { const res = await validateMerchant(userId); if (!res.error) loadData(); } },
    ]);
  };

  const handleSuspend = (userId: string, name: string) => {
    Alert.alert('Suspendre', `Suspendre ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Suspendre', style: 'destructive', onPress: async () => { const res = await suspendMerchant(userId); if (!res.error) loadData(); } },
    ]);
  };

  const handleReactivate = (userId: string, name: string) => {
    Alert.alert('Réactiver', `Réactiver ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réactiver', onPress: async () => { const res = await reactivateMerchant(userId); if (!res.error) loadData(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commerçants</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un commerçant..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => { setPage(1); loadData(1, search); }}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['', 'ACTIVE', 'SUSPENDED', 'PENDING_VALIDATION']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const active = statusFilter === item;
            const color = item === 'ACTIVE' ? '#22C55E' : item === 'SUSPENDED' ? '#EF4444' : item === 'PENDING_VALIDATION' ? '#F59E0B' : Colors.primary;
            return (
              <TouchableOpacity
                style={[styles.filterBtn, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => { setStatusFilter(item); setPage(1); loadData(1, search, item); }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item === '' ? 'Tous' : item === 'ACTIVE' ? 'Actif' : item === 'SUSPENDED' ? 'Suspendu' : 'En attente'}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 6 }}
        />
      </View>

      {loading && merchants.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={merchants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const profile = item.merchantProfile;
            const validated = profile?.validated;
            const statusColor = item.status === 'ACTIVE' ? '#22C55E' : '#EF4444';
            return (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => router.push(`/(admin)/merchants/${item.id}` as any)}
                >
                  <View style={styles.avatar}>
                    <Ionicons name="storefront" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{profile?.businessName || item.name || item.phone}</Text>
                    <Text style={styles.cardPhone}>{item.phone}</Text>
                    <View style={styles.badges}>
                      <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
                        <Text style={[styles.badgeText, { color: statusColor }]}>{item.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}</Text>
                      </View>
                      {validated ? (
                        <View style={[styles.badge, { backgroundColor: '#ECFDF5' }]}>
                          <Text style={[styles.badgeText, { color: '#22C55E' }]}>Validé</Text>
                        </View>
                      ) : (
                        <View style={[styles.badge, { backgroundColor: '#FFF7ED' }]}>
                          <Text style={[styles.badgeText, { color: '#F59E0B' }]}>En attente</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.actions}>
                  {!validated && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleValidate(item.id)}>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    </TouchableOpacity>
                  )}
                  {item.status === 'ACTIVE' ? (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleSuspend(item.id, profile?.businessName || item.phone)}>
                      <Ionicons name="ban" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleReactivate(item.id, profile?.businessName || item.phone)}>
                      <Ionicons name="refresh-circle" size={20} color="#22C55E" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            hasMore && merchants.length > 0 ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => { const next = page + 1; setPage(next); loadData(next); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucun commerçant</Text> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 22,
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    marginBottom: 8, elevation: 2,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF7ED',
    justifyContent: 'center', alignItems: 'center',
  },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardPhone: { fontSize: 12, color: Colors.textMuted },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  actionBtn: { padding: 4 },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  filters: { marginTop: 10, marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
});
