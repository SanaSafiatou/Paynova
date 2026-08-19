import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { formatAmount } from '../../src/utils/format';
import { getMerchantProfile } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfilScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMerchantProfile();
      if (data.data) setProfile(data.data);
    } catch (e) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          try { await logout(); } catch {}
          router.replace('/auth/phone');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon profil</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{profile?.name || 'Commerçant'}</Text>
          <Text style={styles.phone}>{profile?.phone || '—'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: profile?.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.statusText, { color: profile?.status === 'ACTIVE' ? '#059669' : '#DC2626' }]}>
              {profile?.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
            </Text>
          </View>
        </View>

        {/* Business info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du commerce</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="storefront" label="Nom du commerce" value={profile?.merchantProfile?.businessName || '—'} />
            <InfoRow icon="briefcase" label="Type d'activité" value={profile?.merchantProfile?.businessType || '—'} />
            <InfoRow icon="location" label="Adresse" value={profile?.merchantProfile?.businessAddress || '—'} />
            <InfoRow icon="code-slash" label="Code marchand" value={profile?.merchantProfile?.merchantCode || '—'} />
            <InfoRow
              icon="checkmark-circle"
              label="Statut validation"
              value={profile?.merchantProfile?.validated ? 'Validé' : 'En attente'}
              valueColor={profile?.merchantProfile?.validated ? '#059669' : '#D97706'}
            />
          </View>
        </View>

        {/* Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solde</Text>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceValue}>
              {new Intl.NumberFormat('fr-FR').format(profile?.balance || 0)} FCFA
            </Text>
            <Text style={styles.balanceLabel}>Solde principal</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.left}>
        <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
        <Text style={infoStyles.label}>{label}</Text>
      </View>
      <Text style={[infoStyles.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  avatarSection: { alignItems: 'center', marginTop: -20, marginBottom: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  name: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  phone: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  balanceCard: {
    backgroundColor: Colors.primaryDark, borderRadius: 12, padding: 20, alignItems: 'center',
  },
  balanceValue: { fontSize: 22, fontWeight: '800', color: Colors.white },
  balanceLabel: { fontSize: 12, color: '#A78BFA', marginTop: 4 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 24, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#FEE2E2', gap: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: Colors.error },
});
