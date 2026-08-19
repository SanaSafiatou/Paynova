import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { getSettings, updateSettings } from '../../../src/api/client';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [activeGroup, setActiveGroup] = useState('fees');

  useFocusEffect(useCallback(() => { loadSettings(); }, []));

  const loadSettings = async () => {
    setLoading(true);
    const res = await getSettings();
    setLoading(false);
    if (res.data) {
      setSettings(res.data);
      const vals: Record<string, any> = {};
      for (const [key, config] of Object.entries(res.data) as [string, any][]) {
        vals[key] = config.value;
      }
      setEditValues(vals);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateSettings(editValues);
    setSaving(false);
    if (res.error) {
      Alert.alert('Erreur', res.error);
    } else {
      Alert.alert('Succès', 'Paramètres mis à jour');
      loadSettings();
    }
  };

  const groups = [
    { key: 'fees', label: 'Frais', icon: 'cash' },
    { key: 'limits', label: 'Plafonds', icon: 'trending-up' },
    { key: 'general', label: 'Général', icon: 'globe' },
    { key: 'security', label: 'Sécurité', icon: 'shield-checkmark' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  const getGroupSettings = (group: string) => {
    return Object.entries(settings).filter(([key]) => key.startsWith(group + '.'));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      {/* Group tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {groups.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.tab, activeGroup === g.key && styles.tabActive]}
            onPress={() => setActiveGroup(g.key)}
          >
            <Ionicons name={g.icon as any} size={16} color={activeGroup === g.key ? Colors.white : Colors.textMuted} />
            <Text style={[styles.tabText, activeGroup === g.key && styles.tabTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Settings list */}
      <View style={styles.card}>
        {getGroupSettings(activeGroup).map(([key, config]) => (
          <View key={key} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{config.label}</Text>
            {config.type === 'boolean' ? (
              <TouchableOpacity
                style={[styles.toggle, editValues[key] && styles.toggleOn]}
                onPress={() => setEditValues((prev) => ({ ...prev, [key]: !prev[key] }))}
              >
                <View style={[styles.toggleDot, editValues[key] && styles.toggleDotOn]} />
              </TouchableOpacity>
            ) : config.type === 'number' ? (
              <View style={styles.numberInput}>
                <TextInput
                  style={styles.numberField}
                  keyboardType="numeric"
                  value={String(editValues[key] ?? '')}
                  onChangeText={(t) => setEditValues((prev) => ({ ...prev, [key]: parseFloat(t) || 0 }))}
                />
                {config.unit && <Text style={styles.unit}>{config.unit}</Text>}
              </View>
            ) : (
              <TextInput
                style={styles.textInput}
                value={String(editValues[key] ?? '')}
                onChangeText={(t) => setEditValues((prev) => ({ ...prev, [key]: t }))}
              />
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  tabs: { paddingHorizontal: 22, gap: 8, marginBottom: 16 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, marginHorizontal: 22, elevation: 2, padding: 4,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  numberInput: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numberField: {
    width: 90, backgroundColor: '#F8F7FC', borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, fontWeight: '600', color: Colors.textPrimary,
    textAlign: 'right',
  },
  unit: { fontSize: 12, color: Colors.textMuted },
  textInput: {
    width: 120, backgroundColor: '#F8F7FC', borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: Colors.textPrimary, textAlign: 'right',
  },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', padding: 2,
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white },
  toggleDotOn: { marginLeft: 20 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 22, marginTop: 20, backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 14,
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
