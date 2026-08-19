import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getSuperDocuments, deleteSuperDocument } from '../../src/api/client';

const fileIcon = (type: string) => {
  if (type?.includes('pdf')) return 'document-text' as const;
  if (type?.includes('image') || type?.includes('jpeg') || type?.includes('png'))
    return 'image' as const;
  return 'document' as const;
};

const fileColor = (type: string) => {
  if (type?.includes('pdf')) return '#EF4444';
  if (type?.includes('image') || type?.includes('jpeg') || type?.includes('png'))
    return '#2563EB';
  return '#6B7280';
};

const fileTypeLabel = (type: string) => {
  if (type?.includes('pdf')) return 'PDF';
  if (type?.includes('jpeg') || type?.includes('jpg')) return 'JPEG';
  if (type?.includes('png')) return 'PNG';
  return type?.split('/').pop()?.toUpperCase() ?? 'Fichier';
};

export default function SuperAdminDocuments() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await getSuperDocuments({ page: p, limit: 20 });
    setLoading(false);
    if (res.data) {
      if (p === 1) setDocuments(res.data.documents);
      else setDocuments((prev) => [...prev, ...res.data!.documents]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      loadData(1);
    }, []),
  );

  const handleDelete = (doc: any) => {
    Alert.alert(
      'Supprimer le document',
      `Supprimer definitivement "${doc.fileName || doc.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteSuperDocument(doc.id);
            if (res.error) {
              Alert.alert('Erreur', res.error);
            } else {
              setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            }
          },
        },
      ],
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
      </View>

      {loading && documents.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: `${fileColor(item.mimeType || item.fileType)}12` },
                ]}
              >
                <Ionicons
                  name={fileIcon(item.mimeType || item.fileType)}
                  size={22}
                  color={fileColor(item.mimeType || item.fileType)}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.fileName || item.name || 'Sans nom'}
                </Text>
                <View style={styles.cardMeta}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: `${fileColor(item.mimeType || item.fileType)}12`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: fileColor(item.mimeType || item.fileType) },
                      ]}
                    >
                      {fileTypeLabel(item.mimeType || item.fileType)}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                {item.user && (
                  <Text style={styles.cardUploader}>
                    {item.user.name || item.user.phone || 'Utilisateur inconnu'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            hasMore && documents.length > 0 ? (
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
                  name="folder-open-outline"
                  size={48}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTitle}>Aucun document</Text>
                <Text style={styles.emptySubtitle}>
                  Les documents KYC des utilisateurs apparaissent ici
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
  list: { padding: 22 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  cardDate: { fontSize: 11, color: Colors.textMuted },
  cardUploader: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMore: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 64 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
