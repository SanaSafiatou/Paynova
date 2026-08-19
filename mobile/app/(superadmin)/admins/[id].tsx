import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import {
  getSuperAdminDetail, suspendSuperAdmin, reactivateSuperAdmin, updateSuperAdmin,
} from '../../../src/api/client';

export default function AdminDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editingRole, setEditingRole] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await getSuperAdminDetail(id);
    setLoading(false);
    if (res.data) {
      setAdmin(res.data);
      setEditName(res.data.name || '');
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSuspend = () => {
    Alert.alert(
      'Suspendre l\'administrateur',
      `Voulez-vous vraiment suspendre ${admin?.name || admin?.phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Suspendre',
          style: 'destructive',
          onPress: async () => {
            const res = await suspendSuperAdmin(id!);
            if (!res.error) loadData();
            else Alert.alert('Erreur', res.error);
          },
        },
      ],
    );
  };

  const handleReactivate = () => {
    Alert.alert(
      'Réactiver l\'administrateur',
      `Voulez-vous réactiver le compte de ${admin?.name || admin?.phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réactiver',
          onPress: async () => {
            const res = await reactivateSuperAdmin(id!);
            if (!res.error) loadData();
            else Alert.alert('Erreur', res.error);
          },
        },
      ],
    );
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.');
      return;
    }
    const res = await updateSuperAdmin(id!, { name: editName.trim() });
    if (!res.error) {
      setEditingName(false);
      loadData();
    } else {
      Alert.alert('Erreur', res.error);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    const res = await updateSuperAdmin(id!, { role: newRole });
    if (!res.error) {
      setEditingRole(false);
      loadData();
    } else {
      Alert.alert('Erreur', res.error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!admin) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Administrateur non trouvé</Text>
      </View>
    );
  }

  const statusColor = admin.status === 'ACTIVE' ? '#22C55E' : '#EF4444';
  const roleColor = admin.role === 'SUPER_ADMIN' ? '#7C3AED' : '#3B82F6';
  const sessions = admin.sessions || [];
  const devices = admin.devices || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: `${roleColor}15` }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>
            {(admin.name || admin.phone)[0].toUpperCase()}
          </Text>
        </View>

        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingName(false); setEditName(admin.name || ''); }}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => { setEditingName(true); setEditName(admin.name || ''); }}>
            <Text style={styles.userName}>{admin.name || 'Sans nom'}</Text>
            <Ionicons name="pencil" size={12} color={Colors.textMuted} style={{ alignSelf: 'center', marginTop: 2 }} />
          </TouchableOpacity>
        )}

        <Text style={styles.userPhone}>{admin.phone}</Text>

        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: `${roleColor}15` }]}>
            <Text style={[styles.badgeText, { color: roleColor }]}>
              {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {admin.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Rôle" value={admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} />
        <InfoRow label="Téléphone vérifié" value={admin.phoneVerified ? 'Oui' : 'Non'} />
        <InfoRow label="Compte validé" value={admin.accountValidated ? 'Oui' : 'Non'} />
        <InfoRow
          label="Inscrit le"
          value={new Date(admin.createdAt).toLocaleDateString('fr-FR')}
        />
        <InfoRow
          label="Actions d'audit"
          value={String(admin.auditActionsCount ?? 0)}
          last
        />
      </View>

      <View style={styles.actionsRow}>
        {admin.status === 'ACTIVE' ? (
          <TouchableOpacity style={styles.dangerBtn} onPress={handleSuspend}>
            <Ionicons name="ban" size={18} color="#EF4444" />
            <Text style={styles.dangerBtnText}>Suspendre</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.successBtn} onPress={handleReactivate}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.successBtnText}>Réactiver</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.roleBtn}
          onPress={() => setEditingRole(!editingRole)}
        >
          <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
          <Text style={styles.roleBtnText}>Changer le rôle</Text>
        </TouchableOpacity>
      </View>

      {editingRole && (
        <View style={styles.rolePicker}>
          <TouchableOpacity
            style={[styles.roleOption, admin.role === 'ADMIN' && styles.roleOptionActive]}
            onPress={() => handleRoleChange('ADMIN')}
          >
            <Text style={[styles.roleOptionText, admin.role === 'ADMIN' && styles.roleOptionTextActive]}>
              Admin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleOption, admin.role === 'SUPER_ADMIN' && styles.roleOptionActive]}
            onPress={() => handleRoleChange('SUPER_ADMIN')}
          >
            <Text style={[styles.roleOptionText, admin.role === 'SUPER_ADMIN' && styles.roleOptionTextActive]}>
              Super Admin
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Sessions actives</Text>
      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>Aucune session active</Text>
      ) : (
        sessions.map((session: any) => (
          <View key={session.id} style={styles.listItem}>
            <View style={[styles.listIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="laptop-outline" size={16} color="#3B82F6" />
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listLabel}>{session.ip || 'IP inconnue'}</Text>
              <Text style={styles.listSub}>
                {session.userAgent?.substring(0, 40) || 'Navigateur inconnu'}
                {session.userAgent && session.userAgent.length > 40 ? '...' : ''}
              </Text>
              <Text style={styles.listDate}>
                {session.createdAt ? new Date(session.createdAt).toLocaleDateString('fr-FR') : ''}
                {session.expiresAt ? ` - Expire le ${new Date(session.expiresAt).toLocaleDateString('fr-FR')}` : ''}
              </Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Appareils enregistrés</Text>
      {devices.length === 0 ? (
        <Text style={styles.emptyText}>Aucun appareil enregistré</Text>
      ) : (
        devices.map((device: any) => (
          <View key={device.id || device.deviceId} style={styles.listItem}>
            <View style={[styles.listIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons
                name={device.platform === 'ios' ? 'phone-portrait-outline' : 'phone-landscape-outline'}
                size={16}
                color="#7C3AED"
              />
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listLabel}>{device.deviceId || 'Appareil inconnu'}</Text>
              <Text style={styles.listSub}>{device.platform || 'N/A'} - {device.model || 'N/A'}</Text>
              <Text style={styles.listDate}>
                {device.lastSeenAt ? `Dernière activité: ${new Date(device.lastSeenAt).toLocaleDateString('fr-FR')}` : ''}
              </Text>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[infoStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  label: { fontSize: 14, color: Colors.textMuted },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { padding: 22, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  profileCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 2,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  userPhone: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  editRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  editInput: {
    fontSize: 18, fontWeight: '700', color: Colors.textPrimary,
    borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingVertical: 4, minWidth: 120,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, padding: 6,
  },
  cancelBtn: {
    borderRadius: 10, padding: 6,
  },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 12, elevation: 2,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  dangerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 12,
  },
  dangerBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  successBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#ECFDF5', borderRadius: 12, paddingVertical: 12,
  },
  successBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 14 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#F5F3FF', borderRadius: 12, paddingVertical: 12,
  },
  roleBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  rolePicker: {
    flexDirection: 'row', gap: 8, marginTop: 10,
  },
  roleOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  roleOptionActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  roleOptionText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  roleOptionTextActive: { color: Colors.white },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 24, marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 6, elevation: 1,
  },
  listIcon: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  listInfo: { flex: 1 },
  listLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  listSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  listDate: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 12 },
});
