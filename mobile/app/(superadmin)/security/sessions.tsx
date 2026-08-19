import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getSuperActiveSessions, revokeSuperSession } from '../../../src/api/client';

export default function ActiveSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await getSuperActiveSessions({ page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setSessions(res.data.sessions);
      else setSessions((prev) => [...prev, ...res.data!.sessions]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, []);

  useFocusEffect(useCallback(() => { setPage(1); loadData(1); }, []));

  const handleRevoke = (id: string, userName: string) => {
    Alert.alert(
      'Révoquer la session',
      `Révoquer la session de ${userName} ? L'utilisateur sera déconnecté.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            const res = await revokeSuperSession(id);
            if (!res.error) {
              setSessions((prev) => prev.filter((s) => s.id !== id));
            } else {
              Alert.alert('Erreur', res.error);
            }
          },
        },
      ],
    );
  };

  const formatUserAgent = (ua: string) => {
    if (!ua) return 'Navigateur inconnu';
    if (ua.length > 60) return ua.slice(0, 60) + '...';
    return ua;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sessions actives</Text>
      </View>

      {loading && sessions.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                  <Ionicons name="person" size={18} color={Colors.primary} />
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.userName}>{item.user?.name || item.user?.phone || item.userId || 'Utilisateur'}</Text>
                  {item.user?.phone && <Text style={styles.userPhone}>{item.user.phone}</Text>}
                </View>
                <View style={styles.activeDot} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="globe-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{item.ip || 'IP inconnue'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="desktop-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{formatUserAgent(item.userAgent)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.infoText}>
                    {item.lastActive ? new Date(item.lastActive).toLocaleString('fr-FR') : 'Inconnu'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.revokeBtn}
                onPress={() => handleRevoke(item.id, item.user?.name || item.user?.phone || 'cet utilisateur')}
              >
                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.revokeBtnText}>Révoquer</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            hasMore && sessions.length > 0 ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => { setPage((p) => p + 1); loadData(page + 1); }}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Aucune session active</Text> : null}
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
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardHeaderInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  userPhone: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  cardBody: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  revokeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  revokeBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
