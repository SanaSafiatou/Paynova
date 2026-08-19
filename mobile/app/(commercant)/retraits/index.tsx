import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../../src/theme/colors';
import { formatAmount } from '../../../src/utils/format';
import { getMerchantBalance, getMerchantWithdrawals, requestMerchantWithdrawal } from '../../../src/api/client';

export default function RetraitsScreen() {
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, w] = await Promise.all([
        getMerchantBalance(),
        getMerchantWithdrawals({ page: 1, limit: 30 }),
      ]);
      if (b.data) setBalance(b.data.merchantBalance || 0);
      if (w.data) setWithdrawals(w.data.withdrawals || []);
    } catch (e) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    const value = parseFloat(amount.replace(/\s/g, ''));
    if (isNaN(value) || value < 100) {
      Alert.alert('Erreur', 'Montant minimum: 100 FCFA');
      return;
    }
    if (value > balance) {
      Alert.alert('Erreur', 'Solde insuffisant');
      return;
    }

    Alert.alert(
      'Confirmer le retrait',
      `Demander un retrait de ${formatAmount(value)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setSubmitting(true);
            try {
              await requestMerchantWithdrawal(value);
              Alert.alert('Succès', 'Demande de retrait envoyée');
              setAmount('');
              await load();
            } catch (e: any) {
              Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de traiter la demande');
            }
            setSubmitting(false);
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE': return { bg: '#FEF3C7', color: '#D97706', label: 'En attente' };
      case 'APPROUVE': return { bg: '#D1FAE5', color: '#059669', label: 'Approuvé' };
      case 'REFUSE': return { bg: '#FEE2E2', color: '#DC2626', label: 'Refusé' };
      case 'TERMINE': return { bg: '#DBEAFE', color: '#2563EB', label: 'Terminé' };
      default: return { bg: '#F3F4F6', color: '#6B7280', label: status };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Retraits</Text>
        <Text style={styles.headerSub}>Solde: {formatAmount(balance)}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Request form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Demander un retrait</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Montant en FCFA"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity
            style={[styles.withdrawBtn, submitting && { opacity: 0.6 }]}
            onPress={handleWithdraw}
            disabled={submitting}
          >
            <Ionicons name="wallet" size={18} color={Colors.white} />
            <Text style={styles.withdrawBtnText}>{submitting ? 'Envoi...' : 'Demander le retrait'}</Text>
          </TouchableOpacity>
        </View>

        {/* Withdrawals list */}
        <Text style={styles.sectionTitle}>Historique des retraits</Text>
        {withdrawals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune demande de retrait</Text>
          </View>
        ) : (
          withdrawals.map((w) => {
            const status = getStatusStyle(w.status);
            return (
              <View key={w.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Ionicons name="wallet" size={18} color={Colors.primary} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.cardAmount}>{formatAmount(Number(w.amount))}</Text>
                    <Text style={styles.cardDate}>{new Date(w.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: '#DDD6FE', marginTop: 2 },
  formCard: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginTop: -8,
    borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  inputWrap: {
    backgroundColor: Colors.inputBg, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.inputBorder, marginBottom: 14,
  },
  input: {
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    color: Colors.textPrimary, fontWeight: '600',
  },
  withdrawBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  withdrawBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, marginHorizontal: 16, padding: 14,
    borderRadius: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardAmount: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 30 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 12 },
});
