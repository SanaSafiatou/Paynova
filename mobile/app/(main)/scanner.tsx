import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../src/theme/colors';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Alert.alert(
      'QR Code détecté',
      `Contenu : ${data}`,
      [
        { text: 'Scanner à nouveau', onPress: () => setScanned(false) },
        { text: 'Retour', onPress: () => router.back() },
      ],
    );
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permBox}>
          <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.permTitle}>Accès caméra requis</Text>
          <Text style={styles.permText}>
            PayNova a besoin d{'\''}accéder à votre caméra pour scanner les codes QR.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.8}>
            <Text style={styles.permBtnText}>Autoriser l{'\''}accès</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.scanTitle}>Scanner</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scanArea}>
            <View style={styles.cornerTL} /><View style={styles.cornerTR} />
            <View style={styles.cornerBL} /><View style={styles.cornerBR} />
          </View>

          <Text style={styles.hint}>Placez un code QR dans le cadre</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', paddingBottom: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 18 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scanTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  scanArea: { alignSelf: 'center', width: 250, height: 250, position: 'relative' },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.white, borderTopLeftRadius: 8 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderColor: Colors.white, borderTopRightRadius: 8 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: Colors.white, borderBottomLeftRadius: 8 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderColor: Colors.white, borderBottomRightRadius: 8 },
  hint: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontWeight: '500' },
  permBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  permTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  permText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  permBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  permBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
