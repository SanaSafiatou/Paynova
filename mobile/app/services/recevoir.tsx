import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function ReceiveScreen() {
  const router = useRouter();
  const phone = '+225 07 00 00 00 00';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reçu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="download-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Recevoir de l{'\''}argent</Text>
          <Text style={styles.cardSubtitle}>
            Partagez vos informations pour recevoir un transfert depuis un autre utilisateur PayNova.
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Numéro de téléphone</Text>
              <Text style={styles.infoValue}>{phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="qr-code" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Code QR PayNova</Text>
              <Text style={styles.infoValue}>Disponible dans l{'\''}onglet Scanner</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={18} color={Colors.primary} />
            <Text style={styles.shareText}>Partager mes coordonnées</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pendingCard}>
          <Text style={styles.pendingTitle}>En attente de réception</Text>
          <Text style={styles.pendingText}>
            Aucun transfert en cours. Les demandes de réception apparaîtront ici.
          </Text>
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
  card: { marginHorizontal: 22, marginTop: 20, backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 3, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: Colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary },
  shareText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  pendingCard: { marginHorizontal: 22, marginTop: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 2 },
  pendingTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  pendingText: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
});
