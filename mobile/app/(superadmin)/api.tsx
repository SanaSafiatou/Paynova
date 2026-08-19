import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getSuperApiConfigs, createSuperApiConfig, revokeSuperApiConfig } from '../../src/api/client';

export default function ApiConfig() {
  const router = useRouter();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState('');

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await getSuperApiConfigs({ page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setConfigs(res.data.configs);
      else setConfigs((prev) => [...prev, ...res.data!.configs]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, []);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la clé API');
      return;
    }
    setCreating(true);
    const res = await createSuperApiConfig({ name: newName.trim() });
    setCreating(false);
    if (res.error) {
      Alert.alert('Erreur', res.error);
      return;
    }
    const key = res.data?.key || res.data?.apiKey || res.data?.secret || '';
    if (key) {
      setCreatedKey(key);
    }
    setNewName('');
    setShowCreate(false);
    loadData(1);
    setPage(1);
  };

  const handleRevoke = (id: string, name: string) => {
    Alert.alert(
      'Révoquer la clé API',
      `Révoquer la clé "${name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            const res = await revokeSuperApiConfig(id);
            if (!res.error) {
              loadData(1);
              setPage(1);
            } else {
              Alert.alert('Erreur', res.error);
            }
          },
        },
      ],
    );
  };

  const maskKey = (key: string) => {
    if (!key) return '****';
    if (key.length <= 8) return key;
    return key.slice(0, 6) + '****';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Configuration API</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setShowCreate(!showCreate); setCreatedKey(''); }}>
            <Ionicons name={showCreate ? 'close' : 'add'} size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {createdKey ? (
        <View style={styles.keyBanner}>
          <View style={styles.keyBannerHeader}>
            <Ionicons name="key" size={18} color="#22C55E" />
            <Text style={styles.keyBannerTitle}>Clé créée avec succès</Text>
          </View>
          <Text style={styles.keyBannerSubtext}>Copiez cette clé, elle ne sera plus affichée.</Text>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyValue} selectable>{createdKey}</Text>
          </View>
        </View>
      ) : null}

      {showCreate ? (
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Nouvelle clé API</Text>
          <TextInput
            style={styles.createInput}
            placeholder="Nom de la clé"
            placeholderTextColor={Colors.textMuted}
            value={newName}
            onChangeText={setNewName}
          />
          <TouchableOpacity
            style={[styles.createBtn, creating && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="add-circle" size={16} color={Colors.white} />
                <Text style={styles.createBtnText}>Créer la clé</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && configs.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={configs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isActive = item.status === 'ACTIVE' || !item.revoked;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: isActive ? '#ECFDF5' : '#F3F4F6' }]}>
                      <Ionicons name="key" size={18} color={isActive ? '#22C55E' : '#6B7280'} />
                    </View>
                    <View>
                      <Text style={styles.configName}>{item.name}</Text>
                      <Text style={styles.keyPrefix}>{maskKey(item.key || item.apiKey || '')}</Text>
                    </View>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2' }]}>
                    <Text style={[styles.badgeText, { color: isActive ? '#22C55E' : '#EF4444' }]}>
                      {isActive ? 'Actif' : 'Révoqué'}
                    </Text>
                  </View>
                </View>
                {item.permissions && item.permissions.length > 0 && (
                  <View style={styles.permissionsRow}>
                    {item.permissions.map((p: string, i: number) => (
                      <View key={i} style={styles.permTag}>
                        <Text style={styles.permText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
                  {isActive && (
                    <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(item.id, item.name)}>
                      <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                      <Text style={styles.revokeBtnText}>Révoquer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            hasMore && configs.length > 0 ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => { setPage((p) => p + 1); loadData(page + 1); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucune clé API configurée</Text> : null}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  keyBanner: {
    marginHorizontal: 22, marginBottom: 12, backgroundColor: '#ECFDF5',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#BBF7D0',
  },
  keyBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  keyBannerTitle: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  keyBannerSubtext: { fontSize: 12, color: '#065F46', opacity: 0.7, marginBottom: 8 },
  keyValueRow: { backgroundColor: '#D1FAE5', borderRadius: 8, padding: 10 },
  keyValue: { fontSize: 13, fontWeight: '700', color: '#065F46', fontFamily: 'monospace' },
  createCard: {
    marginHorizontal: 22, marginBottom: 12, backgroundColor: Colors.white,
    borderRadius: 14, padding: 16, elevation: 2,
  },
  createTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  createInput: {
    backgroundColor: Colors.inputBg, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.inputBorder, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary, marginBottom: 10,
  },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
  },
  createBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  configName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  keyPrefix: { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  permissionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  permTag: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  permText: { fontSize: 11, fontWeight: '600', color: Colors.primaryDark },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  dateText: { fontSize: 12, color: Colors.textMuted },
  revokeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revokeBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
