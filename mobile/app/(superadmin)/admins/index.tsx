import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import {
  getSuperAdmins, suspendSuperAdmin, reactivateSuperAdmin, createSuperAdmin,
} from '../../../src/api/client';
import { useAuth } from '../../../src/context/AuthContext';

const ROLES = [
  { value: '', label: 'Tous' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
];

export default function AdminsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (
    p = 1,
    q = search,
    role = roleFilter,
    status = statusFilter,
  ) => {
    setLoading(true);
    const res = await getSuperAdmins({
      q: q || undefined,
      role: role || undefined,
      status: status || undefined,
      page: p,
      limit: 20,
    });
    setLoading(false);
    if (res.data) {
      if (p === 1) setAdmins(res.data.admins);
      else setAdmins((prev) => [...prev, ...res.data!.admins]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, [search, roleFilter, statusFilter]);

  useFocusEffect(useCallback(() => {
    setPage(1);
    loadData(1);
  }, []));

  const handleSuspend = (admin: any) => {
    Alert.alert(
      'Suspendre l\'administrateur',
      `Voulez-vous vraiment suspendre ${admin.name || admin.phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Suspendre',
          style: 'destructive',
          onPress: async () => {
            const res = await suspendSuperAdmin(admin.id);
            if (!res.error) {
              loadData(1);
            } else {
              Alert.alert('Erreur', res.error);
            }
          },
        },
      ],
    );
  };

  const handleReactivate = (admin: any) => {
    Alert.alert(
      'Réactiver l\'administrateur',
      `Voulez-vous réactiver le compte de ${admin.name || admin.phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réactiver',
          onPress: async () => {
            const res = await reactivateSuperAdmin(admin.id);
            if (!res.error) {
              loadData(1);
            } else {
              Alert.alert('Erreur', res.error);
            }
          },
        },
      ],
    );
  };

  const handleCreateAdmin = async () => {
    Alert.alert('Créer un administrateur', 'Créer un nouvel admin avec les paramètres par défaut ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Créer',
        onPress: async () => {
          const res = await createSuperAdmin({
            name: 'Admin ' + Date.now(),
            phone: `+225${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            pin: '1234',
          });
          if (!res.error) {
            loadData(1);
            Alert.alert('Succès', 'Administrateur créé avec succès');
          } else {
            Alert.alert('Erreur', res.error || "Impossible de créer l'administrateur");
          }
        },
      },
    ]);
  };

  const roleBadgeColor = (role: string) =>
    role === 'SUPER_ADMIN' ? '#7C3AED' : '#3B82F6';

  const statusBadgeColor = (status: string) =>
    status === 'ACTIVE' ? '#22C55E' : '#EF4444';

  const statusLabel = (status: string) =>
    status === 'ACTIVE' ? 'Actif' : 'Suspendu';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administrateurs</Text>
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

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Rôle</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ROLES}
          keyExtractor={(item) => `role-${item.value}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, roleFilter === item.value && styles.filterActive]}
              onPress={() => { setRoleFilter(item.value); setPage(1); loadData(1, search, item.value, statusFilter); }}
            >
              <Text style={[styles.filterText, roleFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 6 }}
        />
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Statut</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUSES}
          keyExtractor={(item) => `status-${item.value}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, statusFilter === item.value && styles.filterActive]}
              onPress={() => { setStatusFilter(item.value); setPage(1); loadData(1, search, roleFilter, item.value); }}
            >
              <Text style={[styles.filterText, statusFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 6 }}
        />
      </View>

      {loading && admins.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push(`/(superadmin)/admins/${item.id}` as any)}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.avatar, { backgroundColor: `${roleBadgeColor(item.role)}15` }]}>
                    <Text style={[styles.avatarText, { color: roleBadgeColor(item.role) }]}>
                      {(item.name || item.phone || 'A')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name || 'Sans nom'}</Text>
                    <Text style={styles.cardPhone}>{item.phone}</Text>
                    <View style={styles.cardBadges}>
                      <View style={[styles.roleBadge, { backgroundColor: `${roleBadgeColor(item.role)}15` }]}>
                        <Text style={[styles.roleBadgeText, { color: roleBadgeColor(item.role) }]}>
                          {item.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusBadgeColor(item.status)}15` }]}>
                        <Text style={[styles.statusBadgeText, { color: statusBadgeColor(item.status) }]}>
                          {statusLabel(item.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              {item.id !== user?.id && (
                <View style={styles.actionsRow}>
                  {item.status === 'ACTIVE' ? (
                    <TouchableOpacity style={styles.suspendBtn} onPress={() => handleSuspend(item)}>
                      <Ionicons name="ban" size={14} color="#EF4444" />
                      <Text style={styles.suspendBtnText}>Suspendre</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.reactivateBtn} onPress={() => handleReactivate(item)}>
                      <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                      <Text style={styles.reactivateBtnText}>Réactiver</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            hasMore && admins.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => { setPage((p) => p + 1); loadData(page + 1); }}
              >
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>Aucun administrateur trouvé</Text> : null
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreateAdmin} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: {
    paddingTop: 52, paddingHorizontal: 22, paddingBottom: 12,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8,
  },
  backBtnText: {
    color: Colors.primary, fontSize: 14, fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 22,
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: Colors.textPrimary,
  },
  filterSection: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 22,
  },
  filterLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textMuted, minWidth: 36,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    padding: 22, paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, marginBottom: 8, elevation: 2, overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14,
  },
  cardLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    fontSize: 18, fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14, fontWeight: '700', color: Colors.textPrimary,
  },
  cardPhone: {
    fontSize: 12, color: Colors.textMuted, marginTop: 1,
  },
  cardBadges: {
    flexDirection: 'row', gap: 6, marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10, fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10, fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, padding: 8, gap: 8,
  },
  suspendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 8,
  },
  suspendBtnText: {
    color: '#EF4444', fontWeight: '700', fontSize: 12,
  },
  reactivateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#ECFDF5', borderRadius: 10, paddingVertical: 8,
  },
  reactivateBtnText: {
    color: '#22C55E', fontWeight: '700', fontSize: 12,
  },
  loadMore: {
    paddingVertical: 16, alignItems: 'center',
  },
  loadMoreText: {
    color: Colors.primary, fontWeight: '600', fontSize: 14,
  },
  emptyText: {
    textAlign: 'center', color: Colors.textMuted, marginTop: 40,
  },
  fab: {
    position: 'absolute', bottom: 24, right: 22,
    width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});
