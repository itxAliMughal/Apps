import { Ionicons } from "@expo/vector-icons";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera"; // Updated import
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions(); // Using Expo's permission hook
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState("off");
  const [torchOn, setTorchOn] = useState(false);
  const [isFrameLarge, setIsFrameLarge] = useState(false);
  const [showPermissionInfo, setShowPermissionInfo] = useState(false);
  const cameraRef = useRef(null);
  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => {
    const checkPermission = async () => {
      // Check if we already have permission
      if (!permission?.granted) {
        // If not, request permission
        const { granted } = await requestPermission();

        if (!granted) {
          // Show the manual permission message for 8 seconds if denied
          setShowPermissionInfo(true);
          setTimeout(() => setShowPermissionInfo(false), 8000);
        }
      }
    };

    checkPermission();
  }, []);

  const toggleTorch = () => {
    setTorchOn(!torchOn);
    setFlashMode(torchOn ? "off" : "torch");
  };

  const toggleFrameSize = () => {
    setIsFrameLarge(!isFrameLarge);
  };

  const handleScan = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: true,
        });
        const result = await TextRecognition.recognize(photo.uri);
        router.push({
          pathname: "/result-screen",
          params: {
            text: result.text,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        Alert.alert("Scan Error", error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (!permission) {
    // Still loading permission info
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    // Permission not granted
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan documents
        </Text>

        {showPermissionInfo && (
          <Text style={styles.permissionHelpText}>
            Please enable camera permission in your phone settings
          </Text>
        )}

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            const { granted } = await requestPermission();
            if (!granted) {
              setShowPermissionInfo(true);
              setTimeout(() => setShowPermissionInfo(false), 8000);
            }
          }}
        >
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />

      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          ref={cameraRef}
          facing="back"
          enableTorch={torchOn}
          flashMode={flashMode}
          ratio="full"
          autoFocus="on"
          focusDepth={0}
        />
      )}

      {/* Rest of your camera UI remains the same */}
      <View style={styles.overlay}>
        <View style={[styles.scanFrame, isFrameLarge && styles.scanFrameLarge]}>
          <View style={styles.frameBorder} />
          <View style={styles.frameCornerTL} />
          <View style={styles.frameCornerTR} />
          <View style={styles.frameCornerBL} />
          <View style={styles.frameCornerBR} />
        </View>
        <Text style={styles.instructionText}>
          {isFrameLarge
            ? "Scan multiple numbers now"
            : "Align name and number within the frame"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, torchOn && styles.activeButton]}
          onPress={toggleTorch}
        >
          <Ionicons
            name={torchOn ? "flashlight" : "flash-off"}
            size={28}
            color={torchOn ? "#FFD700" : "white"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={toggleFrameSize}>
          <Ionicons
            name={isFrameLarge ? "contract" : "expand"}
            size={28}
            color="white"
          />
        </TouchableOpacity>

        {isProcessing ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Text style={styles.scanButtonText}>SCAN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  scanFrame: {
    width: "80%",
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrameLarge: {
    width: "90%",
    height: "55%",
  },
  frameBorder: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#00FF00",
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  frameCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: "#00FF00",
    width: 30,
    height: 30,
  },
  frameCornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: "#00FF00",
    width: 30,
    height: 30,
  },
  frameCornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#00FF00",
    width: 30,
    height: 30,
  },
  frameCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#00FF00",
    width: 30,
    height: 30,
  },
  instructionText: {
    color: "white",
    marginTop: 30,
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 70,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 50,
    marginRight: 20,
  },
  activeButton: {
    backgroundColor: "rgba(255,215,0,0.3)",
  },
  scanButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    padding: 20,
  },
  permissionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  permissionHelpText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  settingsButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
