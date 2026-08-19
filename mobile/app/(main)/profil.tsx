import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

const MENU_ITEMS = [
  { icon: 'person-outline' as const, label: 'Informations personnelles', color: Colors.primary, route: '' },
  { icon: 'lock-closed-outline' as const, label: 'Sécurité du compte', color: '#3B82F6', route: '' },
  { icon: 'notifications-outline' as const, label: 'Préférences de notification', color: '#F59E0B', route: '/services/notifications' },
  { icon: 'help-circle-outline' as const, label: 'Aide et support', color: '#22C55E', route: '' },
  { icon: 'document-text-outline' as const, label: 'Conditions d\'utilisation', color: '#6B7280', route: '' },
];

export default function ProfilScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon compte</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={Colors.white} />
          </View>
          <Text style={styles.userName}>Client PayNova</Text>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() => { if (item.route) router.push(item.route as any); }}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: item.color + '12' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={() => {
            router.dismissAll();
            router.replace('/auth/phone');
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC', paddingTop: 60, paddingHorizontal: 22 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 24, textAlign: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  userName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  menuCard: { backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
