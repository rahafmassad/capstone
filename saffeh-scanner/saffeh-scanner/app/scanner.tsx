import { Button, QRScanner, StatusCard, ThemedText } from '@/components';
import { Config } from '@/constants';
import { useTheme } from '@/hooks';
import { apiService, type QRValidationResponse } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

const { height } = Dimensions.get('window');

type ScanStatus = 'idle' | 'scanning' | 'validating' | 'success' | 'error';

interface ScanResult {
  status: ScanStatus;
  title: string;
  message?: string;
  details?: { label: string; value: string }[];
}

export default function ScannerScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResult>({
    status: 'idle',
    title: '',
  });
  const [lastScannedToken, setLastScannedToken] = useState<string>('');

  const handleScan = useCallback(async (data: string) => {
    // Prevent re-scanning the same token
    if (data === lastScannedToken) return;
    
    setIsScanning(false);
    setLastScannedToken(data);
    
    // Show validating status
    setScanResult({
      status: 'validating',
      title: 'Validating QR Code...',
      message: 'Please wait while we verify the entry',
    });

    try {
      // Call the API to validate the QR code
      const response: QRValidationResponse = await apiService.validateQRCode(
        data,
        'GATE_001', // You can make this configurable
        'GUARD_001' // You can make this configurable
      );

      if (response.success) {
        // Haptic feedback for success
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const details: { label: string; value: string }[] = [];
        
        if (response.data?.vehicleInfo) {
          const { vehicleInfo } = response.data;
          if (vehicleInfo.plateNumber) {
            details.push({ label: 'Plate Number', value: vehicleInfo.plateNumber });
          }
          if (vehicleInfo.entryTime) {
            details.push({ label: 'Entry Time', value: new Date(vehicleInfo.entryTime).toLocaleTimeString() });
          }
          if (vehicleInfo.parkingDuration) {
            details.push({ label: 'Duration', value: vehicleInfo.parkingDuration });
          }
          if (vehicleInfo.fee !== undefined) {
            details.push({ label: 'Fee', value: `${vehicleInfo.fee} JOD` });
          }
        }

        if (response.data?.gateAccess) {
          const { gateAccess } = response.data;
          if (gateAccess.gateId) {
            details.push({ label: 'Gate', value: gateAccess.gateId });
          }
          if (gateAccess.timestamp) {
            details.push({ label: 'Validated At', value: new Date(gateAccess.timestamp).toLocaleTimeString() });
          }
        }

        // Token preview commented out
        // details.push({ label: 'Token', value: `${data.substring(0, 8)}...${data.substring(data.length - 8)}` });

        setScanResult({
          status: 'success',
          title: 'Access Granted',
          message: response.message || 'QR code validated successfully',
          details: details.length > 0 ? details : undefined,
        });

        // Auto-reset after success display time
        setTimeout(() => {
          resetScanner();
        }, Config.SCANNER.SUCCESS_DISPLAY_TIME);
      } else {
        // Haptic feedback for error
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setScanResult({
          status: 'error',
          title: 'Access Denied',
          message: response.message || 'Invalid QR code',
          // Token info in error also commented out
          // details: [
          //   { label: 'Error', value: response.error || 'Validation failed' },
          //   { label: 'Token', value: `${data.substring(0, 8)}...` },
          // ],
        });

        // Auto-reset after error display time
        setTimeout(() => {
          resetScanner();
        }, Config.SCANNER.ERROR_DISPLAY_TIME);
      }
    } catch (error) {
      console.error('Scan error:', error);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setScanResult({
        status: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your network connection.',
        // Error details also commented out
        // details: [
        //   { label: 'Error', value: error instanceof Error ? error.message : 'Unknown error' },
        // ],
      });

      setTimeout(() => {
        resetScanner();
      }, Config.SCANNER.ERROR_DISPLAY_TIME);
    }
  }, [lastScannedToken]);

  const resetScanner = useCallback(() => {
    setIsScanning(true);
    setScanResult({ status: 'idle', title: '' });
    setLastScannedToken('');
  }, []);

  const handleManualReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetScanner();
  };

  const getScanMessage = () => {
    switch (scanResult.status) {
      case 'validating':
        return 'Validating...';
      case 'success':
        return 'Scan successful!';
      case 'error':
        return 'Scan failed. Try again.';
      default:
        return 'Position QR code within the frame';
    }
  };

  const getStatusType = () => {
    switch (scanResult.status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'validating':
        return 'loading';
      default:
        return 'info';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Scanner View */}
      <View style={styles.scannerContainer}>
        <QRScanner
          onScan={handleScan}
          isScanning={isScanning}
          scanMessage={getScanMessage()}
        />
      </View>

      {/* Status Card Overlay */}
      {scanResult.status !== 'idle' && scanResult.status !== 'scanning' && (
        <SafeAreaView style={styles.statusOverlay}>
          <ScrollView
            contentContainerStyle={styles.statusContent}
            showsVerticalScrollIndicator={false}
          >
            <StatusCard
              type={getStatusType()}
              title={scanResult.title}
              message={scanResult.message}
              details={scanResult.details}
              visible={true}
            />

            {/* Manual Reset Button */}
            {(scanResult.status === 'success' || scanResult.status === 'error') && (
              <View style={styles.resetButtonContainer}>
                <Button
                  title="Scan Another"
                  variant="primary"
                  size="medium"
                  onPress={handleManualReset}
                  icon={<Ionicons name="refresh" size={20} color={theme.textLight} />}
                  style={styles.resetButton}
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      )}

      {/* Bottom Controls */}
      <SafeAreaView style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isScanning ? theme.success : theme.warning,
                },
              ]}
            />
            <ThemedText style={styles.statusText}>
              {isScanning ? 'Ready to scan' : 'Processing...'}
            </ThemedText>
          </View>

          {isScanning && (
            <Ionicons
              name="flashlight-outline"
              size={24}
              color={theme.textLight}
              style={styles.flashButton}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 100,
    justifyContent: 'flex-end',
  },
  statusContent: {
    paddingBottom: 20,
  },
  resetButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  resetButton: {
    width: '100%',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 58, 95, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  flashButton: {
    padding: 8,
  },
});