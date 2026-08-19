import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getSuperAdminUsers } from '../../src/api/client';

const ROLES = [
  { value: '', label: 'Tous' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'COMMERCANT', label: 'Commerçant' },
  { value: 'ADMIN', label: 'Admin' },
];

const STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
];

const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;
const statusLabel = (s: string) => STATUSES.find((x) => x.value === s)?.label ?? s;
const statusColor = (s: string) =>
  s === 'ACTIVE' ? '#22C55E' : s === 'SUSPENDED' ? '#EF4444' : '#F59E0B';
const roleColor = (r: string) =>
  r === 'ADMIN' ? '#7C3AED' : r === 'AGENT' ? '#2563EB' : r === 'COMMERCANT' ? '#D97706' : '#6B7280';

export default function SuperAdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(
    async (p = 1, q = search, role = roleFilter, status = statusFilter) => {
      setLoading(true);
      const res = await getSuperAdminUsers({
        q: q || undefined,
        role: role || undefined,
        status: status || undefined,
        page: p,
        limit: 20,
      });
      setLoading(false);
      if (res.data) {
        if (p === 1) setUsers(res.data.users);
        else setUsers((prev) => [...prev, ...res.data!.users]);
        setHasMore(res.data.pagination.page < res.data.pagination.pages);
      }
    },
    [search, roleFilter, statusFilter],
  );

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      loadData(1);
    }, []),
  );

  const formatBalance = (b: number) =>
    Number(b || 0).toLocaleString('fr-FR') + ' F';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
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
          onSubmitEditing={() => {
            setPage(1);
            loadData(1, search);
          }}
        />
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Rôle</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ROLES}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterBtn,
                roleFilter === item.value && styles.filterActive,
              ]}
              onPress={() => {
                setRoleFilter(item.value);
                setPage(1);
                loadData(1, search, item.value, statusFilter);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  roleFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Statut</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUSES}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterBtn,
                statusFilter === item.value && styles.filterActive,
              ]}
              onPress={() => {
                setStatusFilter(item.value);
                setPage(1);
                loadData(1, search, roleFilter, item.value);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {loading && users.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.name || item.phone || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>
                    {item.name || 'Sans nom'}
                  </Text>
                  <Text style={styles.cardPhone}>{item.phone}</Text>
                </View>
                <Text style={styles.cardBalance}>
                  {formatBalance(item.balance)}
                </Text>
              </View>
              <View style={styles.cardBottom}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: `${roleColor(item.role)}15` },
                  ]}
                >
                  <Text
                    style={[styles.roleBadgeText, { color: roleColor(item.role) }]}
                  >
                    {roleLabel(item.role)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${statusColor(item.status)}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: statusColor(item.status) },
                    ]}
                  >
                    {statusLabel(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={
            hasMore && users.length > 0 ? (
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
                  name="people-outline"
                  size={48}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyText}>
                  Aucun utilisateur trouvé
                </Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 22,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filterSection: { marginTop: 10 },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 22,
    marginBottom: 6,
  },
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
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardPhone: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  cardBalance: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  cardBottom: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
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
