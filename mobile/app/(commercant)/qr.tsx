import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getMerchantQr } from '../../src/api/client';

export default function QrScreen() {
  const [qr, setQr] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMerchantQr();
      if (data.data) setQr(data.data);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger le QR Code');
    }
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

  const handleShare = async () => {
    if (!qr) return;
    try {
      await Share.share({
        message: `Paiement à ${qr.businessName}\nCode: ${qr.merchantCode}\nQR: ${qr.qrData}`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon QR Code</Text>
        <Text style={styles.headerSub}>Présentez ce code pour recevoir vos paiements</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {qr ? (
          <View style={styles.qrCard}>
            <Text style={styles.businessName}>{qr.businessName}</Text>
            <Text style={styles.merchantCode}>{qr.merchantCode}</Text>

            <View style={styles.qrPlaceholder}>
              <View style={styles.qrInner}>
                <Ionicons name="qr-code" size={120} color="#000" />
              </View>
            </View>

            <Text style={styles.instruction}>
              Lorsqu'un client scanne ce QR Code, le paiement est automatiquement crédité sur votre compte.
            </Text>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>
                Ce code est unique et lié à votre compte commerçant. Ne le partagez qu'avec vos clients.
              </Text>
            </View>

            <View style={styles.actions}>
              <View style={styles.shareBtn}>
                <Ionicons name="share-outline" size={18} color={Colors.primary} />
                <Text style={styles.shareBtnText} onPress={handleShare}>Partager</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>Chargement du QR Code...</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: '#DDD6FE', marginTop: 2 },
  qrCard: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginTop: -8,
    borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  businessName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  merchantCode: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  qrPlaceholder: {
    width: 200, height: 200, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
    marginTop: 20, backgroundColor: Colors.primaryLight,
  },
  qrInner: { width: 180, height: 180, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center' },
  instruction: {
    fontSize: 12, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 16, lineHeight: 18, paddingHorizontal: 10,
  },
  infoBox: {
    flexDirection: 'row', backgroundColor: Colors.primaryLight, borderRadius: 10,
    padding: 12, marginTop: 16, gap: 8, alignItems: 'flex-start',
  },
  infoText: { fontSize: 11, color: Colors.primaryDark, flex: 1, lineHeight: 16 },
  actions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  shareBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 13, color: Colors.textMuted },
});
