import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getLocation, getLocationGates, Location, Gate, ApiError } from '@/services/api';
import { storage } from '@/utils/storage';

export default function ReservationScreen() {
  const router = useRouter();
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [gatesLoading, setGatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locationId) {
      fetchLocationDetails();
      fetchGates();
    }
  }, [locationId]);

  const fetchLocationDetails = async () => {
    if (!locationId) {
      setError('Location ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check authentication (location endpoint might be public, but we check for consistency)
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await getLocation(locationId);
      setLocation(response.location);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      const errorMessage = apiError.message || 'Failed to load location details. Please try again.';
      setError(errorMessage);
      console.error('Error fetching location details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGates = async () => {
    if (!locationId) {
      return;
    }

    setGatesLoading(true);
    try {
      const token = await storage.getToken();
      if (!token) {
        return;
      }

      const response = await getLocationGates(locationId);
      setGates(response.gates || []);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching gates:', err);
      // Don't show error for gates, just log it
    } finally {
      setGatesLoading(false);
    }
  };

  const handleGatePress = (gate: Gate) => {
    // Handle gate selection (to be implemented)
    console.log('Gate pressed:', gate.name);
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1E3264" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Reservation</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3264" />
            <Text style={styles.loadingText}>Loading location details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchLocationDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : location ? (
          <View style={styles.content}>
            {/* Location Card */}
            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="location-on" size={48} color="#1E3264" />
              </View>

              <Text style={styles.locationName}>{location.name}</Text>

              {location.city && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="place" size={20} color="#666666" />
                  <Text style={styles.infoText}>{location.city}</Text>
                </View>
              )}

              {location.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{location.description}</Text>
                </View>
              )}

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{formatDate(location.createdAt)}</Text>
                </View>

                {location.updatedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Updated</Text>
                    <Text style={styles.detailValue}>{formatDate(location.updatedAt)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Gates Section */}
            {gates.length > 0 && (
              <View style={styles.gatesSection}>
                <Text style={styles.gatesTitle}>Available Gates</Text>
                {gatesLoading ? (
                  <View style={styles.gatesLoadingContainer}>
                    <ActivityIndicator size="small" color="#1E3264" />
                  </View>
                ) : (
                  <View style={styles.gatesContainer}>
                    {gates.map((gate) => (
                      <TouchableOpacity
                        key={gate.id}
                        style={styles.gateButton}
                        onPress={() => handleGatePress(gate)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="door-sliding" size={24} color="#1E3264" />
                        <Text style={styles.gateButtonText}>{gate.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3264',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E3264',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  locationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3264',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666666',
  },
  descriptionContainer: {
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  detailsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    textAlign: 'right',
  },
  gatesSection: {
    marginTop: 30,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  gatesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3264',
    marginBottom: 16,
  },
  gatesLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  gatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 120,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3264',
  },
});

