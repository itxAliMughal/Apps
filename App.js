import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as OCR from 'expo-mlkit-ocr';
import * as Contacts from 'expo-contacts';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [textBlocks, setTextBlocks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: contactStatus } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted' && contactStatus === 'granted');
    })();
  }, []);

  const handleScan = async () => {
    if (!cameraRef.current) return;

    setIsProcessing(true);
    const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });

    const blocks = await OCR.detectFromUri(photo.uri);
    setTextBlocks(blocks);
    setIsProcessing(false);
  };

  // Extract phone number from scanned text
  const getPhoneNumber = () => {
    const joinedText = textBlocks.map(b => b.text).join(' ');
    const match = joinedText.match(/\+?\d{10,13}/); // match 10-13 digit number
    return match ? match[0] : '';
  };

  const getName = () => {
    return textBlocks.length ? textBlocks[0].text : 'Unknown';
  };

  const handleWhatsApp = () => {
    const phone = getPhoneNumber();
    if (phone) {
      const url = `https://wa.me/${phone}`;
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    const phone = getPhoneNumber();
    if (phone) {
      const url = `tel:${phone}`;
      Linking.openURL(url);
    }
  };

  const handleSaveContact = async () => {
    const phone = getPhoneNumber();
    const name = getName();

    if (phone && name) {
      const contact = {
        [Contacts.Fields.FirstName]: name,
        [Contacts.Fields.PhoneNumbers]: [{ label: 'mobile', number: phone }]
      };
      await Contacts.addContactAsync(contact);
      alert('Contact saved!');
    } else {
      alert('Invalid name or number');
    }
  };

  if (hasPermission === null) return <View><Text>Requesting Permissions...</Text></View>;
  if (hasPermission === false) return <View><Text>No access to camera or contacts</Text></View>;

  return (
    <View style={styles.container}>
      {!textBlocks.length ? (
        <>
          <Camera style={styles.camera} ref={cameraRef} />
          <TouchableOpacity style={styles.button} onPress={handleScan}>
            <Text style={styles.buttonText}>Scan Text</Text>
          </TouchableOpacity>
          {isProcessing && <ActivityIndicator size="large" color="#fff" style={styles.loader} />}
        </>
      ) : (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Scanned Text:</Text>
          {textBlocks.map((block, index) => (
            <Text key={index} style={styles.text}>{block.text}</Text>
          ))}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
              <Text style={styles.actionText}>📲 WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <Text style={styles.actionText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveContact}>
              <Text style={styles.actionText}>💾 Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  button: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: '#00C851', padding: 15, borderRadius: 10
  },
  buttonText: { color: '#fff', fontSize: 18 },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
  result: { flex: 1, backgroundColor: '#fff', padding: 20 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, marginBottom: 5 },
  actions: { marginTop: 20 },
  actionBtn: {
    backgroundColor: '#4285F4', padding: 15, borderRadius: 10,
    marginBottom: 10, alignItems: 'center'
  },
  actionText: { color: '#fff', fontSize: 18 }
});
