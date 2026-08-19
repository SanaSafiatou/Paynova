import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const YEARS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() + i));

export default function EpargneScreen() {
  const router = useRouter();
  const [scheduledEnabled, setScheduledEnabled] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const scheduledDate = scheduledEnabled && day && month && year
    ? `${day} ${MONTHS[parseInt(month, 10) - 1]} ${year}`
    : null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Épargne</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde épargne</Text>
          <Text style={styles.balanceAmount}>0 FCFA</Text>
          <Text style={styles.balanceHint}>Vos économies sont sécurisées.</Text>
        </View>

        {/* Mode épargne */}
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Mode d{'\''}épargne</Text>

          <View style={styles.modeOption}>
            <View style={styles.modeOptionLeft}>
              <Ionicons name="time-outline" size={20} color={scheduledEnabled ? Colors.primary : Colors.textMuted} />
              <View>
                <Text style={styles.modeOptionLabel}>Date de retrait programmée</Text>
                <Text style={styles.modeOptionHint}>Retirez votre argent à une date choisie</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggle, scheduledEnabled && styles.toggleActive]}
              onPress={() => setScheduledEnabled(!scheduledEnabled)}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleKnob, scheduledEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {!scheduledEnabled && (
            <View style={styles.libreInfo}>
              <View style={styles.libreIconWrap}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              </View>
              <Text style={styles.libreText}>
                Épargne libre — déposez et retirez quand vous le souhaitez, sans contrainte de date.
              </Text>
            </View>
          )}

          {scheduledEnabled && (
            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>Date de retrait prévue</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Jour</Text>
                  <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                    {DAYS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dateOption, day === d && styles.dateOptionActive]}
                        onPress={() => setDay(d)}
                      >
                        <Text style={[styles.dateOptionText, day === d && styles.dateOptionTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Mois</Text>
                  <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                    {MONTHS.map((m, i) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.dateOption, month === String(i + 1) && styles.dateOptionActive]}
                        onPress={() => setMonth(String(i + 1))}
                      >
                        <Text style={[styles.dateOptionText, month === String(i + 1) && styles.dateOptionTextActive]}>
                          {m.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Année</Text>
                  <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                    {YEARS.map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.dateOption, year === y && styles.dateOptionActive]}
                        onPress={() => setYear(y)}
                      >
                        <Text style={[styles.dateOptionText, year === y && styles.dateOptionTextActive]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              {scheduledDate && (
                <View style={styles.datePreview}>
                  <Ionicons name="calendar" size={16} color={Colors.primary} />
                  <Text style={styles.datePreviewText}>Retrait prévu le {scheduledDate}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.actionGrad}>
              <Ionicons name="add-circle-outline" size={22} color={Colors.white} />
              <Text style={styles.actionText}>Déposer</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <View style={styles.actionSecondary}>
              <Ionicons name="arrow-down-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionSecondaryText}>Retirer</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            <Text style={styles.infoTitle}>Votre épargne est protégée</Text>
          </View>
          <Text style={styles.infoText}>
            Les fonds placés en épargne sont sécurisés par PayNova.
          </Text>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Opérations récentes</Text>
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune opération d{'\''}épargne pour le moment</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FC' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 18,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },

  balanceCard: { marginHorizontal: 22, marginTop: 20, backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 3, alignItems: 'center' },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginTop: 6 },
  balanceHint: { fontSize: 12, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },

  /* Mode card */
  modeCard: { marginHorizontal: 22, marginTop: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 20, elevation: 2 },
  modeTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  modeOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modeOptionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  modeOptionHint: { fontSize: 11.5, color: Colors.textMuted, marginTop: 2 },

  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleKnob: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
  },
  toggleKnobActive: { alignSelf: 'flex-end' },

  libreInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F0FDF4',
  },
  libreIconWrap: { marginTop: 1 },
  libreText: { fontSize: 12.5, color: '#374151', lineHeight: 17, flex: 1 },

  /* Date section */
  dateSection: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dateLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 10 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateCol: { flex: 1 },
  dateColLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, textAlign: 'center' },
  dateScroll: { maxHeight: 120, borderRadius: 10, borderWidth: 1, borderColor: Colors.inputBorder, backgroundColor: '#F9FAFB' },
  dateOption: { paddingVertical: 8, alignItems: 'center' },
  dateOptionActive: { backgroundColor: '#F5F3FF' },
  dateOptionText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  dateOptionTextActive: { color: Colors.primary, fontWeight: '700' },
  datePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F5F3FF',
  },
  datePreviewText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 22, marginTop: 16 },
  actionBtn: { flex: 1 },
  actionGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  actionText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  actionSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.white },
  actionSecondaryText: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  infoCard: { marginHorizontal: 22, marginTop: 16, backgroundColor: '#F5F3FF', borderRadius: 16, padding: 18 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  infoText: { fontSize: 12.5, color: Colors.textSecondary, lineHeight: 18 },

  historyCard: { marginHorizontal: 22, marginTop: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 2 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
});
