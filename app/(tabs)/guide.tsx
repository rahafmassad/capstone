import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { storage } from '@/utils/storage';

export default function GuideScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
      }
    };
    checkAuth();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Guide</Text>
        
        {/* Title */}
        <Text style={styles.title}>Usage Guide</Text>

        {/* Usage Guide Section */}
        <View style={styles.section}>
          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>1.</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Sign Up & Login:</Text>
              <Text style={styles.guideText}>
                create your account with your name, email, car number, and password, then log in.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>2.</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Book a Spot:</Text>
              <Text style={styles.guideText}>
                in the home page, select your area, gate, or floor, spot number, and time. Book at least 1 hour in advance.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>3.</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Payment & QR Code:</Text>
              <Text style={styles.guideText}>
                pay securely by card. A QR code will be generated, use it to check in at the parking area.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>4.</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Check In:</Text>
              <Text style={styles.guideText}>
                scan the QR code on arrival. It will be consumed after use. Arrive within 1 hour or your spot will be cancelled.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>5.</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Cancel Booking:</Text>
              <Text style={styles.guideText}>
                cancel at least 1 hour before to get a 50% refund.
              </Text>
            </View>
          </View>
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Penalties & Violations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Penalties & Violations</Text>
          <Text style={styles.penaltyText}>
            Late arrival (over 1 hour) = auto cancellation
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3264',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  guideItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  guideNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 12,
    minWidth: 24,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  guideText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  separator: {
    height: 2,
    backgroundColor: '#f6bd33',
    marginVertical: 24,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  penaltyText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
});

