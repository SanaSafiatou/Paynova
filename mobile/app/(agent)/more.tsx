import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';

export default function AgentMore() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const items = [
    { icon: 'wallet', label: 'Mes commissions', route: '/(agent)/commissions', color: '#F59E0B' },
    { icon: 'bar-chart', label: 'Statistiques', route: '/(agent)/stats', color: Colors.primary },
    { icon: 'notifications', label: 'Notifications', route: '/(agent)/notifications', color: '#3B82F6' },
    { icon: 'warning', label: 'Signaler une opération', route: '/(agent)/signaler', color: '#EF4444' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plus</Text>
        <Text style={styles.headerSubtitle}>{user?.name || user?.phone}</Text>
      </View>

      <View style={styles.card}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.row, i < items.length - 1 && styles.rowBorder]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.rowIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC' },
  content: { paddingBottom: 100 },
  header: { paddingTop: 52, paddingHorizontal: 22, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, marginHorizontal: 22, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 24, marginHorizontal: 22, paddingVertical: 16,
    backgroundColor: '#FEF2F2', borderRadius: 14,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
