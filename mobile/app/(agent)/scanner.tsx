import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function AgentScanner() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Ionicons name="scan-outline" size={80} color={Colors.textMuted} />
          <Text style={styles.placeholderTitle}>Scanner un QR Code</Text>
          <Text style={styles.placeholderText}>
            Pointez votre caméra vers le QR Code du client pour l'identifier automatiquement.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(agent)/operations/deposit')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="arrow-down-circle" size={24} color="#22C55E" />
            </View>
            <Text style={styles.actionLabel}>Dépôt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(agent)/operations/withdrawal')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="arrow-up-circle" size={24} color="#EF4444" />
            </View>
            <Text style={styles.actionLabel}>Retrait</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: { paddingTop: 52, paddingHorizontal: 22 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22 },
  placeholder: { alignItems: 'center', marginBottom: 48 },
  placeholderTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  placeholderText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 20 },
  actionBtn: { alignItems: 'center' },
  actionIcon: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});
