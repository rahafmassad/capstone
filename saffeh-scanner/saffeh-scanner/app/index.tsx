import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, Button } from '@/components';
import { useTheme } from '@/hooks';
import { Config } from '@/constants';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleStartScanning = () => {
    router.push('/scanner');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.primary, theme.primaryLight, theme.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header with Settings */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Ionicons
            name="settings-outline"
            size={28}
            color={theme.textLight}
            onPress={handleSettings}
            style={styles.settingsIcon}
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo/Icon Section */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <View style={[styles.logoInner, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Ionicons name="qr-code" size={80} color={theme.textLight} />
              </View>
            </View>
          </View>

          {/* App Title */}
          <View style={styles.titleContainer}>
            <ThemedText
              style={styles.appName}
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
            >
              {Config.APP.NAME}
            </ThemedText>
            <ThemedText
              style={styles.tagline}
              lightColor="rgba(255, 255, 255, 0.85)"
              darkColor="rgba(255, 255, 255, 0.85)"
            >
              {Config.APP.DESCRIPTION}
            </ThemedText>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <FeatureItem
              icon="scan-outline"
              text="Scan parking QR codes"
              color={theme.textLight}
            />
            <FeatureItem
              icon="shield-checkmark-outline"
              text="Instant verification"
              color={theme.textLight}
            />
            <FeatureItem
              icon="time-outline"
              text="Real-time validation"
              color={theme.textLight}
            />
          </View>
        </View>

        {/* Bottom Action Section */}
        <View style={styles.bottomSection}>
          <Button
            title="Start Scanning"
            variant="primary"
            size="large"
            onPress={handleStartScanning}
            style={[styles.scanButton, { backgroundColor: theme.textLight }]}
            icon={<Ionicons name="camera" size={24} color={theme.primary} />}
          />
          
          <ThemedText
            style={styles.versionText}
            lightColor="rgba(255, 255, 255, 0.6)"
            darkColor="rgba(255, 255, 255, 0.6)"
          >
            Version {Config.APP.VERSION}
          </ThemedText>
        </View>
      </SafeAreaView>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}

function FeatureItem({ icon, text, color }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <ThemedText
        style={styles.featureText}
        lightColor="rgba(255, 255, 255, 0.9)"
        darkColor="rgba(255, 255, 255, 0.9)"
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
  },
  headerSpacer: {
    width: 28,
  },
  settingsIcon: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 320,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 32 : 24,
    alignItems: 'center',
  },
  scanButton: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  versionText: {
    fontSize: 12,
    marginTop: 8,
  },
});
