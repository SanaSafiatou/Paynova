import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

const MENU_ITEMS = [
  { icon: 'wallet-outline' as const, label: 'Mon solde', route: '' as string, color: Colors.primary },
  { icon: 'swap-horizontal' as const, label: 'Transactions', route: '/(main)/transactions' as string, color: '#3B82F6' },
  { icon: 'paper-plane' as const, label: 'Transfert', route: '/services/transfert' as string, color: '#7C3AED' },
  { icon: 'download-outline' as const, label: 'Recevoir', route: '/services/recevoir' as string, color: '#22C55E' },
  { icon: 'flash' as const, label: 'Payer', route: '/services/payer' as string, color: '#F59E0B' },
  { icon: 'wallet-outline' as const, label: 'Épargne', route: '/services/epargne' as string, color: '#3B82F6' },
  { icon: 'person' as const, label: 'Profil', route: '/(main)/profil' as string, color: '#6B7280' },
  { icon: 'help-circle-outline' as const, label: 'Aide et support', route: '' as string, color: '#22C55E' },
  { icon: 'document-text-outline' as const, label: 'Conditions d\'utilisation', route: '' as string, color: '#6B7280' },
];

export default function MenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.white} />
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
  screen: { flex: 1, backgroundColor: '#F8F7FC' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 18,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  userName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  menuCard: { marginHorizontal: 22, backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 22, marginTop: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
