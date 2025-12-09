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
import { getReservation, cancelReservation, Reservation, ApiError } from '@/services/api';
import { storage } from '@/utils/storage';

export default function ReservationDetailsScreen() {
  const router = useRouter();
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reservationId) {
      fetchReservationDetails();
    }
  }, [reservationId]);

  const fetchReservationDetails = async () => {
    if (!reservationId) {
      setError('Reservation ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await getReservation(reservationId, token);
      setReservation(response.reservation);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      const errorMessage = apiError.message || 'Failed to load reservation details. Please try again.';
      setError(errorMessage);
      console.error('Error fetching reservation details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'ACTIVE':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'CANCELLED':
        return '#F44336';
      case 'COMPLETED':
        return '#2196F3';
      default:
        return '#666666';
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCancelReservation = async () => {
    if (!reservationId || !reservation) {
      return;
    }

    // Check if reservation can be cancelled
    const status = reservation.status.toUpperCase();
    if (status !== 'PENDING' && status !== 'ACTIVE' && status !== 'CONFIRMED') {
      setError('This reservation cannot be cancelled');
      return;
    }

    setCancelling(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await cancelReservation(reservationId, token);
      
      setSuccessMessage('Reservation cancelled successfully! A voucher has been issued.');
      
      // Refresh reservation details
      await fetchReservationDetails();
      
      // Trigger a refresh of vouchers on home page by using a focus listener
      // This will be handled by the home page checking vouchers on focus
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      console.error('Error cancelling reservation:', err);
      setError(apiError.message || 'Failed to cancel reservation. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelReservation = () => {
    if (!reservation) return false;
    const status = reservation.status.toUpperCase();
    return status === 'PENDING' || status === 'ACTIVE' || status === 'CONFIRMED';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1E3264" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservation Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3264" />
            <Text style={styles.loadingText}>Loading reservation details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchReservationDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : reservation ? (
          <View style={styles.content}>
            {/* Status Card */}
            <View style={styles.card}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(reservation.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{reservation.status}</Text>
                </View>
              </View>
            </View>

            {/* Location & Gate Info */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Location & Gate</Text>
              
              {reservation.location && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={24} color="#1E3264" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{reservation.location.name}</Text>
                  </View>
                </View>
              )}

              {reservation.gate && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="door-sliding" size={24} color="#1E3264" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Gate</Text>
                    <Text style={styles.infoValue}>{reservation.gate.name}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Validity Period */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Validity Period</Text>
              
              <View style={styles.infoRow}>
                <MaterialIcons name="schedule" size={24} color="#1E3264" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Valid From</Text>
                  <Text style={styles.infoValue}>{formatDate(reservation.validFrom)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={24} color="#1E3264" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Valid Until</Text>
                  <Text style={styles.infoValue}>{formatDate(reservation.validUntil)}</Text>
                </View>
              </View>
            </View>

            {/* QR Token */}
            {reservation.qrToken && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>QR Code Token</Text>
                <View style={styles.qrContainer}>
                  <MaterialIcons name="qr-code" size={48} color="#1E3264" />
                  <Text style={styles.qrToken}>{reservation.qrToken}</Text>
                </View>
              </View>
            )}

            {/* Cancel Button */}
            {canCancelReservation() && (
              <View style={styles.card}>
                {successMessage && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
                {error && (
                  <View style={styles.errorMessageContainer}>
                    <Text style={styles.errorMessageText}>{error}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
                  onPress={handleCancelReservation}
                  disabled={cancelling}
                  activeOpacity={0.8}
                >
                  {cancelling ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={styles.cancelButtonLoader} />
                      <Text style={styles.cancelButtonText}>Cancelling...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="cancel" size={20} color="#FFFFFF" />
                      <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
                    </>
                  )}
                </TouchableOpacity>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3264',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1E3264',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3264',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  qrToken: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonLoader: {
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});

