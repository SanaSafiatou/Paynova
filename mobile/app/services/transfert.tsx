import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Contacts from 'expo-contacts';
import { Colors } from '../../src/theme/colors';
import { verifyPin } from '../../src/api/client';

interface ContactItem {
  id: string;
  name: string;
  phone: string;
}

export default function TransfertScreen() {
  const router = useRouter();
  const [beneficiary, setBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [payFees, setPayFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const pinRef = useRef<TextInput>(null);

  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const openContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Autorisation refusée',
        'Vous pouvez saisir manuellement le numéro du bénéficiaire.',
      );
      return;
    }

    setContactsLoading(true);
    setShowContacts(true);

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    });

    const items: ContactItem[] = [];
    for (const c of data) {
      if (c.phoneNumbers && c.phoneNumbers.length > 0 && c.name) {
        items.push({
          id: c.id,
          name: c.name,
          phone: c.phoneNumbers[0].number || '',
        });
      }
    }

    setContacts(items);
    setContactsLoading(false);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch),
  );

  const selectContact = (contact: ContactItem) => {
    setBeneficiary(`${contact.name} — ${contact.phone}`);
    setShowContacts(false);
    setContactSearch('');
  };

  const executeTransfer = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setShowPinModal(false);
    setPin('');
    Alert.alert('Succès', 'Transfert enregistré. En attente de confirmation backend.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const authenticateAndTransfer = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmer le transfert par empreinte digitale',
        cancelLabel: 'Utiliser le PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await executeTransfer();
      } else if (result.error === 'user_cancel' || result.error === 'user_fallback') {
        setShowPinModal(true);
      } else {
        Alert.alert('Échec', 'Authentification biométrique échouée. Le transfert n\'a pas été effectué.');
      }
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }

    setPinLoading(true);
    const result = await verifyPin('+2250700000000', pin);
    setPinLoading(false);

    if (result.error) {
      Alert.alert('Erreur', 'Code PIN incorrect. Le transfert n\'a pas été effectué.');
      setPin('');
      return;
    }

    await executeTransfer();
  };

  const handleTransfer = async () => {
    if (!beneficiary.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le bénéficiaire.');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }

    Alert.alert(
      'Confirmer le transfert',
      `Transférer ${num.toLocaleString('fr-FR')} F à ${beneficiary.trim()} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => authenticateAndTransfer() },
      ],
    );
  };

  const focusPinInput = () => pinRef.current?.focus();

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfert</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bénéficiaire</Text>
          <View style={styles.beneficiaryRow}>
            <TextInput
              style={[styles.input, styles.beneficiaryInput]}
              placeholder="Nom ou numéro du bénéficiaire"
              placeholderTextColor={Colors.textMuted}
              value={beneficiary}
              onChangeText={setBeneficiary}
              autoFocus
            />
            <TouchableOpacity style={styles.contactsBtn} onPress={openContacts} activeOpacity={0.7}>
              <Ionicons name="people" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardLabel}>Montant à transférer</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.amountSuffix}>
              <Text style={styles.amountSuffixText}>FCFA</Text>
            </View>
          </View>

          <View style={styles.quickAmounts}>
            {[500, 1000, 2000, 5000].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.quickBtn, amount === String(v) && styles.quickBtnActive]}
                onPress={() => setAmount(String(v))}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickBtnText, amount === String(v) && styles.quickBtnTextActive]}>
                  {v === 500 ? '500' : v.toLocaleString('fr-FR')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Payez les frais de retrait</Text>
            <TouchableOpacity
              style={[styles.toggle, payFees && styles.toggleActive]}
              onPress={() => setPayFees(!payFees)}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleKnob, payFees && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleTransfer} disabled={loading} activeOpacity={0.8} style={styles.btnWrapper}>
            {loading ? (
              <View style={styles.btn}><ActivityIndicator color={Colors.white} /></View>
            ) : (
              <LinearGradient colors={['#8B5CF6', '#6D28D9', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                <Ionicons name="finger-print" size={20} color={Colors.white} />
                <Text style={styles.btnText}>Authentifier et envoyer</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal contacts */}
      <Modal visible={showContacts} transparent animationType="slide" onRequestClose={() => setShowContacts(false)}>
        <View style={styles.contactsOverlay}>
          <View style={styles.contactsCard}>
            <View style={styles.contactsHeader}>
              <Text style={styles.contactsTitle}>Sélectionner un contact</Text>
              <TouchableOpacity onPress={() => { setShowContacts(false); setContactSearch(''); }}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.contactsSearchRow}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.contactsSearch}
                placeholder="Rechercher un contact..."
                placeholderTextColor={Colors.textMuted}
                value={contactSearch}
                onChangeText={setContactSearch}
                autoFocus
              />
            </View>

            {contactsLoading ? (
              <View style={styles.contactsEmpty}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.contactsEmptyText}>Chargement des contacts...</Text>
              </View>
            ) : filteredContacts.length === 0 ? (
              <View style={styles.contactsEmpty}>
                <Ionicons name="people-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.contactsEmptyText}>
                  {contacts.length === 0
                    ? 'Aucun contact trouvé sur l\'appareil'
                    : 'Aucun résultat pour cette recherche'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.contactItem} onPress={() => selectContact(item)} activeOpacity={0.6}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactPhone}>{item.phone}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal PIN fallback */}
      <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <TouchableOpacity style={styles.pinOverlay} activeOpacity={1} onPress={() => setShowPinModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={focusPinInput}>
            <View style={styles.pinCard}>
              <View style={styles.pinIconWrap}>
                <Ionicons name="lock-closed" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.pinTitle}>Code PIN requis</Text>
              <Text style={styles.pinSubtitle}>
                La biométrie n{'\''}est pas disponible. Saisissez votre code PIN pour confirmer.
              </Text>

              <TouchableOpacity activeOpacity={1} onPress={focusPinInput}>
                <View style={styles.pinRow}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={[styles.pinBox, pin.length > i && styles.pinBoxFilled]}>
                      <Text style={styles.pinDigit}>{pin[i] || ''}</Text>
                      {pin.length === i && <View style={styles.pinCursor} />}
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              <TextInput
                ref={pinRef}
                style={styles.hiddenPinInput}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
                caretHidden
              />

              <TouchableOpacity
                onPress={handlePinSubmit}
                disabled={pinLoading || pin.length !== 4}
                activeOpacity={0.8}
                style={[styles.pinBtn, (pinLoading || pin.length !== 4) && styles.pinBtnDisabled]}
              >
                {pinLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.pinBtnText}>Confirmer</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setShowPinModal(false); setPin(''); }} style={styles.pinCancel}>
                <Text style={styles.pinCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
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
  card: { marginHorizontal: 22, marginTop: 20, backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 3 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 14 },
  beneficiaryRow: { flexDirection: 'row', gap: 10 },
  beneficiaryInput: { flex: 1 },
  contactsBtn: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center',
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary, backgroundColor: '#F9FAFB',
  },
  amountRow: { flexDirection: 'row', gap: 0 },
  amountInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  amountSuffix: {
    width: 64, borderWidth: 1.5, borderLeftWidth: 0, borderColor: Colors.inputBorder,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center',
  },
  amountSuffixText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.inputBorder, backgroundColor: '#F9FAFB', alignItems: 'center',
  },
  quickBtnActive: { borderColor: Colors.primary, backgroundColor: '#F5F3FF' },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.primary },
  feeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  feeLabel: { fontSize: 13.5, fontWeight: '600', color: Colors.textPrimary },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleKnob: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
  },
  toggleKnobActive: { alignSelf: 'flex-end' },
  btnWrapper: { marginTop: 24 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 16, gap: 10 },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },

  /* Contacts modal */
  contactsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  contactsCard: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, maxHeight: '80%',
  },
  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  contactsTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  contactsSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5,
    borderColor: Colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#F9FAFB', marginBottom: 12,
  },
  contactsSearch: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  contactsEmpty: { alignItems: 'center', paddingVertical: 40 },
  contactsEmptyText: { fontSize: 13, color: Colors.textMuted, marginTop: 10 },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  contactInitial: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  contactPhone: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  /* PIN modal */
  pinOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  pinCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  pinIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  pinTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  pinSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  pinRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 8 },
  pinBox: {
    width: 52, height: 58, borderRadius: 14, borderWidth: 2, borderColor: Colors.inputBorder,
    backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center',
  },
  pinBoxFilled: { borderColor: Colors.primary, backgroundColor: '#F5F3FF' },
  pinDigit: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  hiddenPinInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.01, fontSize: 24 },
  pinCursor: { position: 'absolute', width: 2, height: 28, backgroundColor: Colors.primary, borderRadius: 1 },
  pinBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
    width: '100%', alignItems: 'center', marginTop: 20,
  },
  pinBtnDisabled: { opacity: 0.5 },
  pinBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  pinCancel: { marginTop: 14, paddingVertical: 8 },
  pinCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
});
