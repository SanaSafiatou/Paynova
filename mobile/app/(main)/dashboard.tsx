import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

const SERVICES = [
  { icon: 'paper-plane' as const, label: 'Transfert', bg: '#F3E8FF', color: '#7C3AED' },
  { icon: 'download-outline' as const, label: 'Reçu', bg: '#ECFDF5', color: '#22C55E' },
  { icon: 'wallet-outline' as const, label: 'Épargne', bg: '#EFF6FF', color: '#3B82F6' },
  { icon: 'qr-code' as const, label: 'Code QR', bg: '#F0FDF4', color: '#16A34A' },
];

const TRANSACTIONS = [
  { id: '1', type: 'receive' as const, label: 'Transfert reçu', amount: '+ 15 000', date: '17 Août 2026', status: 'Terminé', color: '#22C55E' },
  { id: '2', type: 'send' as const, label: 'Transfert envoyé', amount: '- 5 000', date: '17 Août 2026', status: 'Terminé', color: '#EF4444' },
  { id: '3', type: 'receive' as const, label: 'Paiement reçu', amount: '+ 25 000', date: '16 Août 2026', status: 'Terminé', color: '#22C55E' },
  { id: '4', type: 'send' as const, label: 'Paiement marchand', amount: '- 3 500', date: '16 Août 2026', status: 'Terminé', color: '#EF4444' },
];

const SERVICE_ROUTES: Record<string, string> = {
  Transfert: '/services/transfert',
  Reçu: '/services/recevoir',
  Épargne: '/services/epargne',
  'Code QR': '__QR__',
};

export default function DashboardScreen() {
  const [showBalance, setShowBalance] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.menuBtn} onPress={() => router.push('/services/menu')}>
              <Ionicons name="menu" size={22} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/services/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={Colors.white} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Carte solde */}
        <View style={styles.balanceCard}>
          <View style={styles.brandRow}>
            <Text style={styles.brandPay}>Pay</Text>
            <Text style={styles.brandNova}>Nova</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)} activeOpacity={0.7}>
              <Ionicons
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {showBalance ? '0' : '••••••••'}
          </Text>
          <Text style={styles.balanceCurrency}>FCFA</Text>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map((svc) => (
              <TouchableOpacity
                key={svc.label}
                style={styles.serviceItem}
                activeOpacity={0.7}
                onPress={() => {
                  const route = SERVICE_ROUTES[svc.label];
                  if (route === '__QR__') setShowQR(true);
                  else if (route) router.push(route as any);
                }}
              >
                <View style={[styles.serviceIcon, { backgroundColor: svc.bg }]}>
                  <Ionicons name={svc.icon} size={22} color={svc.color} />
                </View>
                <Text style={styles.serviceLabel}>{svc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transactions récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionTitle}>Transactions récentes</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(main)/transactions')}>
              <Text style={styles.seeAll}>Tout voir</Text>
            </TouchableOpacity>
          </View>
          {TRANSACTIONS.length === 0 ? (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTxText}>Aucune transaction récente</Text>
            </View>
          ) : (
            TRANSACTIONS.map((tx) => (
              <View key={tx.id} style={styles.txItem}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIconCircle, { backgroundColor: tx.color + '12' }]}>
                    <Ionicons
                      name={tx.type === 'receive' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={tx.color}
                    />
                  </View>
                  <View>
                    <Text style={styles.txLabel}>{tx.label}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.color }]}>{tx.amount} F</Text>
                  <Text style={styles.txStatus}>{tx.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal QR Code */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View style={styles.qrTitleRow}>
                <Text style={styles.qrTitlePay}>Pay</Text>
                <Text style={styles.qrTitleNova}>Nova</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQR(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.qrSubtitle}>Mon code QR</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={`paynova://transfer?phone=client&ts=${Date.now()}`}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
                quietZone={8}
                ecl="M"
              />
            </View>
            <Text style={styles.qrHint}>Scannez ce code pour effectuer un transfert</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  scrollContent: {
    paddingBottom: 100,
  },

  /* Header */
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  /* Balance */
  balanceCard: {
    marginHorizontal: 22,
    marginTop: -10,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandPay: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandNova: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: Colors.inputBorder,
    marginBottom: 14,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  balanceCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },

  /* Sections */
  section: {
    marginTop: 24,
    paddingHorizontal: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionAccentBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },

  /* Services grid */
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    alignItems: 'center',
    width: (SCREEN_W - 44 - 16) / 2,
    marginBottom: 20,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  /* Transactions */
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  txDate: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  txStatus: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyTx: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  emptyTxText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },

  /* QR Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  qrTitleRow: {
    flexDirection: 'row',
  },
  qrTitlePay: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  qrTitleNova: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  qrSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  qrBox: {
    width: 230,
    height: 230,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
