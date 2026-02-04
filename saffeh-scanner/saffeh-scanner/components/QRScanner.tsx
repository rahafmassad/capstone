import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks';
import { Config } from '@/constants';
import { ThemedText } from './ThemedText';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export interface QRScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  scanMessage?: string;
}

export function QRScanner({ onScan, isScanning, scanMessage }: QRScannerProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const lastScanTime = useRef<number>(0);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the scan line
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (isScanning) {
      animation.start();
    } else {
      animation.stop();
      scanLineAnim.setValue(0);
    }

    return () => animation.stop();
  }, [isScanning, scanLineAnim]);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    const currentTime = Date.now();
    const { data } = result;

    // Prevent duplicate scans within the scan interval
    if (
      currentTime - lastScanTime.current < Config.SCANNER.SCAN_INTERVAL ||
      data === lastScannedData ||
      !isScanning
    ) {
      return;
    }

    lastScanTime.current = currentTime;
    setLastScannedData(data);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onScan(data);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContent}>
          <ThemedText type="subtitle" style={styles.permissionTitle}>
            Camera Permission Required
          </ThemedText>
          <ThemedText style={styles.permissionText}>
            Please grant camera access to scan QR codes for parking validation.
          </ThemedText>
          <View style={styles.permissionButton}>
            <ThemedText
              style={[styles.permissionButtonText, { color: theme.primary }]}
              onPress={requestPermission}
            >
              Grant Permission
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View style={[styles.overlaySection, { backgroundColor: theme.scannerOverlay }]} />
        
        {/* Middle section with scan area */}
        <View style={styles.middleSection}>
          {/* Left overlay */}
          <View style={[styles.sideOverlay, { backgroundColor: theme.scannerOverlay }]} />
          
          {/* Scan area */}
          <View style={styles.scanArea}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.topLeft, { borderColor: isScanning ? theme.scannerCorner : theme.scannerBorder }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: isScanning ? theme.scannerCorner : theme.scannerBorder }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: isScanning ? theme.scannerCorner : theme.scannerBorder }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: isScanning ? theme.scannerCorner : theme.scannerBorder }]} />
            
            {/* Scan line animation */}
            {isScanning && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: theme.scannerCorner,
                    transform: [{ translateY: scanLineTranslateY }],
                  },
                ]}
              />
            )}
          </View>
          
          {/* Right overlay */}
          <View style={[styles.sideOverlay, { backgroundColor: theme.scannerOverlay }]} />
        </View>
        
        {/* Bottom overlay */}
        <View style={[styles.overlaySection, { backgroundColor: theme.scannerOverlay }]}>
          <View style={styles.instructionContainer}>
            <ThemedText
              style={[styles.instruction, { color: theme.textLight }]}
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
            >
              {scanMessage || 'Position QR code within the frame'}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A90D9',
  },
  permissionButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlaySection: {
    flex: 1,
    width: '100%',
  },
  middleSection: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  sideOverlay: {
    flex: 1,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
  },
  instructionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});
