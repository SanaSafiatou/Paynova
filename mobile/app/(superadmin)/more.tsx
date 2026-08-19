import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  color: string;
  bgColor: string;
}

const menuItems: MenuItem[] = [
  { label: 'Transactions', icon: 'swap-horizontal', route: '/(superadmin)/transactions', color: '#0EA5E9', bgColor: '#F0F9FF' },
  { label: 'Commerçants', icon: 'storefront', route: '/(superadmin)/merchants', color: '#F59E0B', bgColor: '#FFF7ED' },
  { label: 'API', icon: 'key', route: '/(superadmin)/api', color: '#3B82F6', bgColor: '#EFF6FF' },
  { label: 'Documents', icon: 'document-text', route: '/(superadmin)/documents', color: '#8B5CF6', bgColor: '#F5F3FF' },
  { label: 'Statistiques', icon: 'bar-chart', route: '/(superadmin)/stats', color: '#22C55E', bgColor: '#ECFDF5' },
  { label: 'Paramètres', icon: 'settings', route: '/(superadmin)/settings', color: Colors.primary, bgColor: '#F5F3FF' },
];

export default function SuperAdminMore() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plus</Text>
        <TouchableOpacity style={styles.headerLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </View>
          <Text style={styles.logoutLabel}>Déconnexion</Text>
          <Ionicons name="chevron-forward" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  header: {
    backgroundColor: '#1A1A2E', paddingTop: 52, paddingBottom: 24,
    paddingHorizontal: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerLogout: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 22, gap: 10 },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, elevation: 2,
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginTop: 16,
  },
  logoutIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
  },
  logoutLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
