import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function CoffreFortScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coffre-fort</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.balanceCard}>
          <View style={styles.vaultIcon}>
            <Ionicons name="lock-closed" size={36} color={Colors.white} />
          </View>
          <Text style={styles.balanceLabel}>Fonds sécurisés</Text>
          <Text style={styles.balanceAmount}>0 FCFA</Text>
          <Text style={styles.balanceHint}>
            Vos fonds sont protégés dans le coffre-fort numérique PayNova.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.actionGrad}>
              <Ionicons name="lock-open-outline" size={22} color={Colors.white} />
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

        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>Sécurité renforcée</Text>
          <View style={styles.securityItem}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.securityText}>Chiffrement de bout en bout</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.securityText}>Authentification requise pour chaque opération</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.securityText}>Aucun accès non autorisé possible</Text>
          </View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Mouvements récents</Text>
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun mouvement dans le coffre-fort</Text>
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
  vaultIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginTop: 6 },
  balanceHint: { fontSize: 12, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 16 },
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 22, marginTop: 16 },
  actionBtn: { flex: 1 },
  actionGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  actionText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  actionSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.white },
  actionSecondaryText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  securityCard: { marginHorizontal: 22, marginTop: 16, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 18 },
  securityTitle: { fontSize: 14, fontWeight: '700', color: '#166534', marginBottom: 10 },
  securityItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  securityText: { fontSize: 12.5, color: '#374151', flex: 1 },
  historyCard: { marginHorizontal: 22, marginTop: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 2 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
});
