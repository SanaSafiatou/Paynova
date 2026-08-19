import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getAdminUserDetail, getAdminAgentCommissions, updateAgentProfile } from '../../../src/api/client';

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [agentRes, commRes] = await Promise.all([
      getAdminUserDetail(id),
      getAdminAgentCommissions(id),
    ]);
    setLoading(false);
    if (agentRes.data) {
      setAgent(agentRes.data);
      setNotes(agentRes.data.agentProfile?.notes || '');
    }
    if (commRes.data) {
      const comms = commRes.data.commissions || [];
      setCommissions(comms);
      setTotalCommission(comms.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0));
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleToggleTraining = async () => {
    const current = agent?.agentProfile?.trainingComplete;
    const res = await updateAgentProfile(id!, { trainingComplete: !current });
    if (!res.error) loadData();
  };

  const handleSaveNotes = async () => {
    const res = await updateAgentProfile(id!, { notes });
    if (!res.error) Alert.alert('Succès', 'Notes enregistrées');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!agent) return <View style={styles.center}><Text>Agent non trouvé</Text></View>;

  const profile = agent.agentProfile;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(agent.name || agent.phone)[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{agent.name || 'Sans nom'}</Text>
        <Text style={styles.phone}>{agent.phone}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: agent.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2' }]}>
            <Text style={[styles.badgeText, { color: agent.status === 'ACTIVE' ? '#22C55E' : '#EF4444' }]}>
              {agent.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
            </Text>
          </View>
          {profile?.validated && (
            <View style={[styles.badge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.badgeText, { color: '#22C55E' }]}>Validé</Text>
            </View>
          )}
        </View>
      </View>

      {/* Training */}
      <TouchableOpacity style={styles.settingRow} onPress={handleToggleTraining}>
        <Ionicons name="school" size={20} color={Colors.primary} />
        <Text style={styles.settingLabel}>Formation complétée</Text>
        <View style={[styles.toggle, profile?.trainingComplete && styles.toggleOn]}>
          <View style={[styles.toggleDot, profile?.trainingComplete && styles.toggleDotOn]} />
        </View>
      </TouchableOpacity>

      {/* Documents */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Documents</Text>
        </View>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Ionicons name="document-outline" size={40} color={Colors.border} />
          <Text style={styles.emptyText}>Aucun document disponible</Text>
        </View>
      </View>

      {/* Commissions */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="wallet" size={18} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Commissions totales</Text>
          <Text style={styles.sectionValue}>{totalCommission.toLocaleString('fr-FR')} F</Text>
        </View>
        {commissions.length > 0 && commissions.slice(0, 5).map((c) => (
          <View key={c.id} style={styles.commRow}>
            <Text style={styles.commType}>{c.transaction?.type}</Text>
            <Text style={styles.commDate}>{new Date(c.calculatedAt).toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.commAmount}>+{Number(c.amount).toLocaleString('fr-FR')} F</Text>
          </View>
        ))}
        {commissions.length === 0 && <Text style={styles.emptyText}>Aucune commission</Text>}
      </View>

      {/* Notes */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notes internes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Ajouter des notes sur cet agent..."
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNotes}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

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
    width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  name: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  phone: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, elevation: 2,
  },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', padding: 2,
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white },
  toggleDotOn: { marginLeft: 20 },
  sectionCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 12, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  sectionValue: { fontSize: 15, fontWeight: '800', color: '#F59E0B', marginLeft: 'auto' },
  commRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  commType: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  commDate: { fontSize: 12, color: Colors.textMuted, marginHorizontal: 8 },
  commAmount: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  notesInput: {
    backgroundColor: '#F8F7FC', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary,
    minHeight: 80, marginTop: 8,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginTop: 10,
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 10 },
});
