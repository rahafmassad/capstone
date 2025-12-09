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
import { getLocation, getLocationGates, getGateSpots, createReservation, confirmPayment, Location, Gate, SpotWithStatus, ApiError } from '@/services/api';
import { storage } from '@/utils/storage';

export default function ReservationScreen() {
  const router = useRouter();
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [spots, setSpots] = useState<SpotWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [gatesLoading, setGatesLoading] = useState(false);
  const [spotsLoading, setSpotsLoading] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (locationId) {
      fetchLocationDetails();
      fetchGates();
    }
  }, [locationId]);

  // Real-time updates for spots when a gate is selected
  useEffect(() => {
    if (!selectedGate) {
      return;
    }

    // Fetch spots immediately with loading indicator
    fetchSpots(selectedGate.id, true);

    // Set up interval to fetch spots every 5 seconds (silent background updates)
    const interval = setInterval(() => {
      fetchSpots(selectedGate.id, false);
    }, 5000);

    // Cleanup interval on unmount or when gate changes
    return () => clearInterval(interval);
  }, [selectedGate]);

  // Poll for payment confirmation when waiting for payment
  useEffect(() => {
    if (!waitingForPayment || !reservationId || !sessionId) {
      return;
    }

    const pollForPayment = async () => {
      try {
        const token = await storage.getToken();
        if (!token) {
          router.replace('/welcome');
          return;
        }

        const response = await confirmPayment(
          {
            reservationId: reservationId,
            sessionId: sessionId,
          },
          token
        );

        // Payment confirmed successfully
        if (response.reservation.status === 'CONFIRMED' || response.alreadyConfirmed) {
          setWaitingForPayment(false);
          setSuccessMessage('Payment confirmed! Reservation is active.');
          setTimeout(() => {
            router.replace({
              pathname: '/reservation-details',
              params: { reservationId: reservationId },
            });
          }, 2000);
        }
      } catch (err) {
        const apiError = err as ApiError;
        // If payment is not yet confirmed (400 error), continue polling
        // Only stop polling on authentication errors or other critical errors
        if (apiError.status === 401) {
          await storage.clearAuth();
          router.replace('/welcome');
          return;
        }
        // For 400 errors (payment not completed), continue polling silently
        // For other errors, log but continue polling
        if (apiError.status !== 400) {
          console.error('Error confirming payment:', err);
        }
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollForPayment, 3000);

    // Initial poll immediately
    pollForPayment();

    // Cleanup interval
    return () => clearInterval(interval);
  }, [waitingForPayment, reservationId, sessionId]);

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

  const handleGatePress = async (gate: Gate) => {
    setSelectedGate(gate);
    // Initial fetch with loading indicator
    await fetchSpots(gate.id, true);
  };

  const handleSelectGate = async () => {
    if (!selectedGate || !locationId) {
      setError('Please select a gate first');
      setSuccessMessage(null);
      return;
    }

    setReserving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await createReservation(
        {
          locationId: locationId,
          gateId: selectedGate.id,
        },
        token
      );

      // Extract session ID from response
      const extractedSessionId = response.stripe.checkoutSessionId;

      if (!extractedSessionId) {
        throw new Error('Session ID not found in response');
      }

      // Store reservation and session IDs for polling
      setReservationId(response.reservation.id);
      setSessionId(extractedSessionId);

      // Start waiting for payment confirmation
      setWaitingForPayment(true);
      setSuccessMessage('Reservation created! Waiting for payment confirmation...');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      console.error('Error creating reservation:', err);
      setError(apiError.message || 'Failed to create reservation. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  const fetchSpots = async (gateId: string, showLoading: boolean = true) => {
    if (showLoading) {
      setSpotsLoading(true);
      setSpots([]);
    }
    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await getGateSpots(gateId, token);
      setSpots(response.spots || []);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      console.error('Error fetching spots:', err);
      // Don't show error on background updates, only on initial load
      if (showLoading) {
        setError('Failed to load spots. Please try again.');
      }
    } finally {
      if (showLoading) {
        setSpotsLoading(false);
      }
    }
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
                        style={[
                          styles.gateButton,
                          selectedGate?.id === gate.id && styles.gateButtonSelected,
                        ]}
                        onPress={() => handleGatePress(gate)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons 
                          name="door-sliding" 
                          size={24} 
                          color={selectedGate?.id === gate.id ? '#FFFFFF' : '#1E3264'} 
                        />
                        <Text style={[
                          styles.gateButtonText,
                          selectedGate?.id === gate.id && styles.gateButtonTextSelected,
                        ]}>
                          {gate.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Select Button */}
            {selectedGate && !waitingForPayment && (
              <View style={styles.selectButtonContainer}>
                {successMessage && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
                {error && !loading && (
                  <View style={styles.errorMessageContainer}>
                    <Text style={styles.errorMessageText}>{error}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.selectButton, reserving && styles.selectButtonDisabled]}
                  onPress={handleSelectGate}
                  disabled={reserving}
                  activeOpacity={0.8}
                >
                  {reserving ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={styles.selectButtonLoader} />
                      <Text style={styles.selectButtonText}>Creating Reservation...</Text>
                    </>
                  ) : (
                    <Text style={styles.selectButtonText}>Select</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Payment Waiting Screen */}
            {waitingForPayment && (
              <View style={styles.paymentWaitingContainer}>
                <ActivityIndicator size="large" color="#1E3264" />
                <Text style={styles.paymentWaitingTitle}>Waiting for Payment</Text>
                <Text style={styles.paymentWaitingText}>
                  Please complete the payment.
                </Text>
                <Text style={styles.paymentWaitingSubtext}>
                  We'll automatically confirm your reservation once payment is complete.
                </Text>
                {successMessage && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Spots Section */}
            {selectedGate && (
              <View style={styles.spotsSection}>
                <Text style={styles.spotsTitle}>
                  Spots for {selectedGate.name}
                </Text>
                {spotsLoading ? (
                  <View style={styles.spotsLoadingContainer}>
                    <ActivityIndicator size="small" color="#1E3264" />
                    <Text style={styles.spotsLoadingText}>Loading spots...</Text>
                  </View>
                ) : spots.length === 0 ? (
                  <View style={styles.emptySpotsContainer}>
                    <Text style={styles.emptySpotsText}>No spots available</Text>
                  </View>
                ) : (
                  <View style={styles.spotsGrid}>
                    {spots.map((spot) => {
                      const isFree = spot.cvStatus?.toUpperCase() === 'FREE';
                      return (
                        <TouchableOpacity
                          key={spot.id}
                          style={[
                            styles.spotButton,
                            isFree ? styles.spotButtonFree : styles.spotButtonOccupied,
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.spotNumber,
                            isFree ? styles.spotNumberFree : styles.spotNumberOccupied,
                          ]}>
                            {spot.number ?? 'N/A'}
                          </Text>
                          <Text style={[
                            styles.spotStatus,
                            isFree ? styles.spotStatusFree : styles.spotStatusOccupied,
                          ]}>
                            {isFree ? 'Free' : 'Occupied'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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
  gateButtonSelected: {
    backgroundColor: '#1E3264',
    borderColor: '#1E3264',
  },
  gateButtonTextSelected: {
    color: '#FFFFFF',
  },
  spotsSection: {
    marginTop: 30,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  spotsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3264',
    marginBottom: 16,
  },
  spotsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  spotsLoadingText: {
    fontSize: 14,
    color: '#666666',
  },
  emptySpotsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptySpotsText: {
    fontSize: 14,
    color: '#999999',
  },
  spotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  spotButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  spotButtonFree: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  spotButtonOccupied: {
    backgroundColor: '#F5F5F5',
    borderColor: '#9E9E9E',
  },
  spotNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  spotNumberFree: {
    color: '#2E7D32',
  },
  spotNumberOccupied: {
    color: '#616161',
  },
  spotStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  spotStatusFree: {
    color: '#4CAF50',
  },
  spotStatusOccupied: {
    color: '#9E9E9E',
  },
  selectButtonContainer: {
    marginTop: 30,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectButton: {
    backgroundColor: '#1E3264',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  selectButtonDisabled: {
    opacity: 0.6,
  },
  selectButtonLoader: {
    marginRight: 8,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorMessageContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorMessageText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  paymentWaitingContainer: {
    marginTop: 30,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  paymentWaitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3264',
    marginTop: 20,
    marginBottom: 12,
  },
  paymentWaitingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentWaitingSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
});

