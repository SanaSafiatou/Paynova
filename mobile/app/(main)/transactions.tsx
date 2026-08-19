import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';

const TRANSACTIONS = [
  { id: '1', type: 'receive' as const, label: 'Transfert reçu', amount: '+ 15 000', date: '17 Août 2026', status: 'Terminé', color: '#22C55E' },
  { id: '2', type: 'send' as const, label: 'Transfert envoyé', amount: '- 5 000', date: '17 Août 2026', status: 'Terminé', color: '#EF4444' },
  { id: '3', type: 'receive' as const, label: 'Paiement reçu', amount: '+ 25 000', date: '16 Août 2026', status: 'Terminé', color: '#22C55E' },
  { id: '4', type: 'send' as const, label: 'Paiement marchand', amount: '- 3 500', date: '16 Août 2026', status: 'Terminé', color: '#EF4444' },
];

export default function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>
      {TRANSACTIONS.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Aucune transaction pour le moment</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {TRANSACTIONS.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={styles.txLeft}>
                <View style={[styles.txIconCircle, { backgroundColor: tx.color + '12' }]}>
                  <Ionicons name={tx.type === 'receive' ? 'arrow-down' : 'arrow-up'} size={16} color={tx.color} />
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
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FC', paddingTop: 60, paddingHorizontal: 22 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 24, textAlign: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 12 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  txLabel: { fontSize: 13.5, fontWeight: '600', color: Colors.textPrimary },
  txDate: { fontSize: 11.5, color: Colors.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13.5, fontWeight: '700' },
  txStatus: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
});
