import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getSuperSecurityEvents, getSuperUserDevices } from '../../../src/api/client';

export default function SecurityOverview() {
  const router = useRouter();
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [deviceQuery, setDeviceQuery] = useState('');
  const [deviceResult, setDeviceResult] = useState<any[] | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(false);

  useFocusEffect(useCallback(() => { loadTodaySummary(); }, []));

  const loadTodaySummary = async () => {
    setLoadingSummary(true);
    const today = new Date().toISOString().slice(0, 10);
    const [critical, warning] = await Promise.all([
      getSuperSecurityEvents({ severity: 'CRITICAL', from: today, limit: 1 }),
      getSuperSecurityEvents({ severity: 'WARNING', from: today, limit: 1 }),
    ]);
    setLoadingSummary(false);
    setCriticalCount(critical.data?.pagination?.total ?? 0);
    setWarningCount(warning.data?.pagination?.total ?? 0);
  };

  const sections = [
    { title: 'Événements de sécurité', subtitle: 'Historique des événements de sécurité', icon: 'alert-circle' as const, route: '/(superadmin)/security/events' },
    { title: 'Sessions actives', subtitle: 'Gérer les sessions utilisateur actives', icon: 'people' as const, route: '/(superadmin)/security/sessions' },
    { title: 'Appareils', subtitle: 'Rechercher les appareils d\'un utilisateur', icon: 'phone-portrait' as const, route: '' },
    { title: 'Résumé', subtitle: 'Aperçu des événements aujourd\'hui', icon: 'stats-chart' as const, route: '' },
  ];

  const handleDeviceSearch = async () => {
    if (!deviceQuery.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un identifiant utilisateur');
      return;
    }
    setDeviceLoading(true);
    const res = await getSuperUserDevices(deviceQuery.trim());
    setDeviceLoading(false);
    if (res.data && Array.isArray(res.data)) {
      setDeviceResult(res.data);
    } else {
      setDeviceResult([]);
      Alert.alert('Information', res.error || 'Aucun appareil trouvé');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sécurité</Text>
      </View>

      {sections.map((s) => {
        if (s.title === 'Appareils') {
          return (
            <View key={s.title} style={styles.sectionCard}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name={s.icon} size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{s.title}</Text>
                <Text style={styles.sectionSubtitle}>{s.subtitle}</Text>
                <View style={styles.deviceSearchRow}>
                  <TextInput
                    style={styles.deviceInput}
                    placeholder="ID utilisateur ou téléphone"
                    placeholderTextColor={Colors.textMuted}
                    value={deviceQuery}
                    onChangeText={setDeviceQuery}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.deviceSearchBtn} onPress={handleDeviceSearch} disabled={deviceLoading}>
                    {deviceLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons name="search" size={18} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                </View>
                {deviceResult !== null && (
                  deviceResult.length === 0 ? (
                    <Text style={styles.emptyDeviceText}>Aucun appareil trouvé</Text>
                  ) : (
                    deviceResult.map((d: any, i: number) => (
                      <View key={i} style={styles.deviceItem}>
                        <Ionicons name="phone-portrait-outline" size={16} color={Colors.textMuted} />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text style={styles.deviceLabel}>{d.userAgent || 'Appareil inconnu'}</Text>
                          <Text style={styles.deviceMeta}>Dernière activité: {d.lastActive ? new Date(d.lastActive).toLocaleString('fr-FR') : '-'}</Text>
                        </View>
                      </View>
                    ))
                  )
                )}
              </View>
            </View>
          );
        }

        if (s.title === 'Résumé') {
          return (
            <View key={s.title} style={styles.sectionCard}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name={s.icon} size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{s.title}</Text>
                <Text style={styles.sectionSubtitle}>{s.subtitle}</Text>
                {loadingSummary ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
                ) : (
                  <View style={styles.summaryRow}>
                    <View style={[styles.summaryBadge, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="warning" size={14} color="#EF4444" />
                      <Text style={[styles.summaryCount, { color: '#EF4444' }]}>{criticalCount}</Text>
                      <Text style={styles.summaryLabel}>Critique</Text>
                    </View>
                    <View style={[styles.summaryBadge, { backgroundColor: '#FFFBEB' }]}>
                      <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                      <Text style={[styles.summaryCount, { color: '#F59E0B' }]}>{warningCount}</Text>
                      <Text style={styles.summaryLabel}>Avertissement</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={s.title}
            style={styles.sectionCard}
            onPress={() => router.push(s.route as any)}
          >
            <View style={styles.sectionIconWrap}>
              <Ionicons name={s.icon} size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text style={styles.sectionSubtitle}>{s.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { paddingBottom: 40 },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  sectionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 14, marginHorizontal: 22, marginBottom: 10, padding: 16, elevation: 2,
  },
  sectionIconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  deviceSearchRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  deviceInput: {
    flex: 1, backgroundColor: Colors.inputBg, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.inputBorder, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13, color: Colors.textPrimary,
  },
  deviceSearchBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyDeviceText: { fontSize: 12, color: Colors.textMuted, marginTop: 8, fontStyle: 'italic' },
  deviceItem: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  deviceLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  deviceMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  summaryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  summaryCount: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
});
