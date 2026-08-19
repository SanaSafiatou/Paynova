import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

const SERVICES = [
  { icon: 'paper-plane' as const, label: 'Transfert', bg: '#F3E8FF', color: '#7C3AED', route: '/services/transfert' },
  { icon: 'download-outline' as const, label: 'Reçu', bg: '#ECFDF5', color: '#22C55E', route: '/services/recevoir' },
  { icon: 'wallet-outline' as const, label: 'Épargne', bg: '#EFF6FF', color: '#3B82F6', route: '/services/epargne' },
  { icon: 'qr-code' as const, label: 'Code QR', bg: '#F0FDF4', color: '#16A34A', route: '' },
];

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Services</Text>
      <View style={styles.servicesGrid}>
        {SERVICES.map((svc) => (
          <TouchableOpacity
            key={svc.label}
            style={styles.serviceItem}
            activeOpacity={0.7}
            onPress={() => { if (svc.route) router.push(svc.route as any); }}
          >
            <View style={[styles.serviceIcon, { backgroundColor: svc.bg }]}>
              <Ionicons name={svc.icon} size={24} color={svc.color} />
            </View>
            <Text style={styles.serviceLabel}>{svc.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC', paddingTop: 60, paddingHorizontal: 22 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 24, textAlign: 'center' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceItem: { alignItems: 'center', width: (SCREEN_W - 44 - 16) / 2, marginBottom: 24 },
  serviceIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  serviceLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
});
