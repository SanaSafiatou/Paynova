import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminUsers } from '../../../src/api/client';

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1, q = search, role = roleFilter, status = statusFilter) => {
    setLoading(true);
    const res = await getAdminUsers({ q: q || undefined, role: role || undefined, status: status || undefined, page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setUsers(res.data.users);
      else setUsers((prev) => [...prev, ...res.data!.users]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [search, roleFilter, statusFilter]);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const roles = ['', 'CLIENT', 'AGENT', 'COMMERCANT', 'ADMIN'];
  const statuses = ['', 'ACTIVE', 'SUSPENDED', 'PENDING_VALIDATION'];

  const roleLabel = (r: string) => r === '' ? 'Tous' : r === 'CLIENT' ? 'Client' : r === 'AGENT' ? 'Agent' : r === 'COMMERCANT' ? 'Commerçant' : 'Admin';
  const statusLabel = (s: string) => s === '' ? 'Tous' : s === 'ACTIVE' ? 'Actif' : s === 'SUSPENDED' ? 'Suspendu' : 'En attente';
  const statusColor = (s: string) => s === 'ACTIVE' ? '#22C55E' : s === 'SUSPENDED' ? '#EF4444' : '#F59E0B';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou téléphone..."
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
          data={roles}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, roleFilter === item && styles.filterActive]}
              onPress={() => { setRoleFilter(item); setPage(1); loadData(1, search, item, statusFilter); }}
            >
              <Text style={[styles.filterText, roleFilter === item && styles.filterTextActive]}>{roleLabel(item)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 6 }}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const active = statusFilter === item;
            const color = item ? statusColor(item) : Colors.primary;
            return (
              <TouchableOpacity
                style={[styles.filterBtn, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => { setStatusFilter(item); setPage(1); loadData(1, search, roleFilter, item); }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{statusLabel(item)}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 6 }}
        />
      </View>

      {loading && users.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(admin)/users/${item.id}` as any)}
            >
              <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.name || item.phone || 'U')[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.cardName}>{item.name || 'Sans nom'}</Text>
                  <Text style={styles.cardPhone}>{item.phone}</Text>
                  <Text style={styles.cardRole}>{roleLabel(item.role)}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.badge, { backgroundColor: `${statusColor(item.status)}15` }]}>
                  <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            hasMore && users.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => { const next = page + 1; setPage(next); loadData(next); }}
              >
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text> : null}
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
  filters: { marginTop: 10, marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardPhone: { fontSize: 12, color: Colors.textMuted },
  cardRole: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  cardRight: { marginLeft: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
