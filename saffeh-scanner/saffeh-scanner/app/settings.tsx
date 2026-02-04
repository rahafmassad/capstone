import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText, ThemedView, Button } from '@/components';
import { useTheme } from '@/hooks';
import { Config } from '@/constants';
import { apiService } from '@/services';

interface Settings {
  apiUrl: string;
  gateId: string;
  guardId: string;
  enableVibration: boolean;
  enableSound: boolean;
  autoResetDelay: number;
}

const DEFAULT_SETTINGS: Settings = {
  apiUrl: Config.API_BASE_URL,
  gateId: 'GATE_001',
  guardId: 'GUARD_001',
  enableVibration: true,
  enableSound: true,
  autoResetDelay: 3000,
};

export default function SettingsScreen() {
  const theme = useTheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('scanner_settings');
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem('scanner_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('unknown');

    try {
      const isConnected = await apiService.testConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
      
      Alert.alert(
        isConnected ? 'Connection Successful' : 'Connection Failed',
        isConnected
          ? 'Successfully connected to the server.'
          : 'Unable to connect to the server. Please check the API URL and your network connection.'
      );
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert('Connection Error', 'An error occurred while testing the connection.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => saveSettings(DEFAULT_SETTINGS),
        },
      ]
    );
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Server Configuration */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Server Configuration
          </ThemedText>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={styles.inputLabel}>API URL</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.apiUrl}
              onChangeText={(value) => updateSetting('apiUrl', value)}
              placeholder="http://localhost:4000"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <Button
            title={isTestingConnection ? 'Testing...' : 'Test Connection'}
            variant="outline"
            size="medium"
            onPress={handleTestConnection}
            loading={isTestingConnection}
            disabled={isTestingConnection}
            icon={
              <Ionicons
                name={
                  connectionStatus === 'success'
                    ? 'checkmark-circle'
                    : connectionStatus === 'error'
                    ? 'close-circle'
                    : 'wifi'
                }
                size={20}
                color={
                  connectionStatus === 'success'
                    ? theme.success
                    : connectionStatus === 'error'
                    ? theme.error
                    : theme.primary
                }
              />
            }
            style={styles.testButton}
          />
        </View>

        {/* Gate Configuration */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Gate Configuration
          </ThemedText>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={styles.inputLabel}>Gate ID</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.gateId}
              onChangeText={(value) => updateSetting('gateId', value)}
              placeholder="GATE_001"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={styles.inputLabel}>Guard ID</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.guardId}
              onChangeText={(value) => updateSetting('guardId', value)}
              placeholder="GUARD_001"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Scanner Preferences */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Scanner Preferences
          </ThemedText>

          <View style={[styles.toggleContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.toggleContent}>
              <Ionicons name="phone-portrait-outline" size={24} color={theme.icon} />
              <View style={styles.toggleText}>
                <ThemedText style={styles.toggleLabel}>Vibration Feedback</ThemedText>
                <ThemedText style={styles.toggleDescription} lightColor={theme.textSecondary} darkColor={theme.textSecondary}>
                  Vibrate on successful scan
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.enableVibration}
              onValueChange={(value) => updateSetting('enableVibration', value)}
              trackColor={{ false: theme.border, true: theme.primaryLight }}
              thumbColor={settings.enableVibration ? theme.primary : theme.textMuted}
            />
          </View>

          <View style={[styles.toggleContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.toggleContent}>
              <Ionicons name="volume-high-outline" size={24} color={theme.icon} />
              <View style={styles.toggleText}>
                <ThemedText style={styles.toggleLabel}>Sound Feedback</ThemedText>
                <ThemedText style={styles.toggleDescription} lightColor={theme.textSecondary} darkColor={theme.textSecondary}>
                  Play sound on scan result
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.enableSound}
              onValueChange={(value) => updateSetting('enableSound', value)}
              trackColor={{ false: theme.border, true: theme.primaryLight }}
              thumbColor={settings.enableSound ? theme.primary : theme.textMuted}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            About
          </ThemedText>

          <View style={[styles.infoContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <InfoRow label="App Name" value={Config.APP.NAME} theme={theme} />
            <InfoRow label="Version" value={Config.APP.VERSION} theme={theme} />
            <InfoRow label="API Endpoint" value={Config.API_ENDPOINTS.QR_VALIDATE} theme={theme} />
          </View>
        </View>

        {/* Reset Button */}
        <View style={styles.section}>
          <Button
            title="Reset to Defaults"
            variant="ghost"
            size="medium"
            onPress={handleResetSettings}
            icon={<Ionicons name="refresh" size={20} color={theme.error} />}
            style={[styles.resetButton, { borderColor: theme.error }]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}

function InfoRow({ label, value, theme }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <ThemedText style={styles.infoLabel} lightColor={theme.textSecondary} darkColor={theme.textSecondary}>
        {label}
      </ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  testButton: {
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  infoContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
});
