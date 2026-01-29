import { ScreenBackground } from '@/components/screen-background';
import { Skeleton } from '@/components/skeleton-loader';
import { ApiError, cancelReservation, getReservation, Reservation } from '@/services/api';
import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReservationDetailsScreen() {
  const router = useRouter();
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancellationInfoModal, setShowCancellationInfoModal] = useState(false);

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
    router.push('/');
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
      
      // Refresh reservation details to show updated status
      await fetchReservationDetails();
      
      // Don't navigate away - let user stay on the page and use back button to return home
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
    <ScreenBackground>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={32} color="#f6bd33" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservation Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.skeletonContainer}>
            <Skeleton width={100} height={32} borderRadius={16} style={{ marginBottom: 24, alignSelf: 'center' }} />
            <View style={styles.skeletonCard}>
              <Skeleton width={60} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={18} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width="80%" height={16} borderRadius={4} />
            </View>
            <View style={styles.skeletonCard}>
              <Skeleton width={60} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={18} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width="70%" height={16} borderRadius={4} />
            </View>
            <View style={styles.skeletonCard}>
              <Skeleton width={60} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={18} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width="60%" height={16} borderRadius={4} />
            </View>
            <View style={styles.skeletonCard}>
              <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={18} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width="80%" height={16} borderRadius={4} />
            </View>
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
            {/* Status Badge */}
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

            {/* Location & Gate Info */}
            <View style={styles.card}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Location & Gate</Text>
              </View>
              
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
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Validity Period</Text>
              </View>
              
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

            {/* Cancellation Information - only show if reservation is cancelled */}
            {(reservation.status?.toUpperCase() === 'CANCELLED' || reservation.cancelledAt) && (
              <View style={styles.card}>
                <View style={styles.cardHeaderWithRight}>
                  <View style={styles.cardHeaderLeft}>
                    <MaterialIcons name="cancel" size={24} color="#F44336" />
                    <Text style={styles.cardTitle}>Cancellation Information</Text>
                  </View>
                  <View style={styles.infoIconContainer}>
                    <TouchableOpacity
                      onPress={() => setShowCancellationInfoModal(!showCancellationInfoModal)}
                      activeOpacity={0.7}
                      style={styles.infoIconButton}
                    >
                      <MaterialIcons name="info-outline" size={24} color="#666666" />
                    </TouchableOpacity>
                    {showCancellationInfoModal && (
                      <>
                        <View style={styles.tooltip}>
                          <Text style={styles.tooltipText}>
                            This reservation has been cancelled. A voucher has been issued to your account.
                          </Text>
                        </View>
                        <View style={styles.tooltipArrowBorder} />
                        <View style={styles.tooltipArrow} />
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="block" size={24} color="#F44336" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, { color: '#F44336' }]}>Cancelled</Text>
                  </View>
                </View>
                {reservation.cancelledAt && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="event-busy" size={24} color="#F44336" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Cancelled At</Text>
                      <Text style={styles.infoValue}>{formatDate(reservation.cancelledAt)}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}


            {/* Cancel Button - only show if reservation can be cancelled */}
            {canCancelReservation() && (
              <View>
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

      {/* Success Modal - show after cancellation */}
      <Modal
        visible={!!successMessage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessMessage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSuccessMessage(null)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={24} color="#666666" />
            </TouchableOpacity>
            <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
            <Text style={styles.successModalTitle}>Reservation Cancelled</Text>
            <Text style={styles.successModalText}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    marginTop: 16,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardHeaderWithRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoIconContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  infoIconButton: {
    padding: 4,
  },
  tooltip: {
    position: 'absolute',
    bottom: 34,
    right: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 250,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    transform: [{ translateX: 109 }], // Center tooltip above icon: (250/2 - 16) = 109px from right
  },
  tooltipArrowBorder: {
    position: 'absolute',
    bottom: 26,
    right: 12, // Center of icon (24px icon / 2 + 4px padding = 16px from right)
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E0E0E0',
    zIndex: 1000,
    transform: [{ translateX: 4.5 }], // Center arrow (half of arrow width)
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: 27,
    right: 12, // Center of icon (24px icon / 2 + 4px padding = 16px from right)
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    zIndex: 1001,
    transform: [{ translateX: 4 }], // Center arrow (half of arrow width)
  },
  tooltipText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  cardTitleContainer: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3264',
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
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    marginHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successModalText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
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

