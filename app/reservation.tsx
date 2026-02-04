import { ScreenBackground } from '@/components/screen-background';
import { Skeleton } from '@/components/skeleton-loader';
import { ApiError, confirmPayment, createReservation, getLocation, getVouchers, Location, Voucher } from '@/services/api';
import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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

export default function ReservationScreen() {
  const router = useRouter();
  const { locationId, gateId, gateName /* blockIndex, spotCount */ } = useLocalSearchParams<{
    locationId: string;
    gateId: string;
    gateName: string;
    // blockIndex: string;
    // spotCount: string;
  }>();

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVoucherInfoModal, setShowVoucherInfoModal] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reservationStatus, setReservationStatus] = useState<'PENDING' | 'ACTIVE' | null>(null);
  const [pricing, setPricing] = useState<{
    baseAmountJOD: number;
    finalAmountJOD: number;
    discountAmountJOD?: number;
  } | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  useEffect(() => {
    if (locationId) {
      fetchLocationDetails();
      checkVouchers();
    }
  }, [locationId]);

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
          setReservationStatus('ACTIVE');
          setError(null);
          setShowSuccessModal(true);
        }
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.status === 401) {
          await storage.clearAuth();
          router.replace('/welcome');
          return;
        }
        if (apiError.status !== 400) {
          console.error('Error confirming payment:', err);
        }
      }
    };

    const interval = setInterval(pollForPayment, 3000);
    pollForPayment();

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

  const checkVouchers = async () => {
    setVouchersLoading(true);
    try {
      const token = await storage.getToken();
      if (!token) {
        return;
      }

      const response = await getVouchers(token);
      // Filter out used vouchers and expired vouchers
      const filtered = response.vouchers.filter(
        (v) => !v.used && (!v.expiresAt || new Date(v.expiresAt) > new Date())
      );
      setAvailableVouchers(filtered);
      // The best voucher will be applied automatically by the backend when creating reservation
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      setAvailableVouchers([]); // Set empty array on error
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!gateId || !locationId) {
      setError('Missing required information');
      return;
    }

    setReserving(true);
    setError(null);

    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await createReservation(
        {
          locationId: locationId,
          gateId: gateId,
        },
        token
      );

      // Store reservation details
      setReservationId(response.reservation.id);
      setSessionId(response.stripe.checkoutSessionId);
      setCheckoutUrl(response.stripe.checkoutUrl);
      setPricing(response.pricing);
      setAppliedVoucher(response.appliedVoucher || null);
      setReservationStatus('PENDING');
      
      // Automatically proceed to payment after showing pricing briefly
      setWaitingForPayment(true);
      
      // Open Stripe checkout in browser
      try {
        await WebBrowser.openBrowserAsync(response.stripe.checkoutUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      } catch (error) {
        console.error('Error opening checkout URL:', error);
        setError('Failed to open payment page. Please try again.');
        setWaitingForPayment(false);
      }
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

  const handleBack = () => {
    if (reservationStatus === 'ACTIVE') {
      // Navigate to home page when reservation is active
      router.replace('/(tabs)');
    } else {
      // Navigate back to parking slot page otherwise
      router.back();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FFA726';
      case 'ACTIVE':
      case 'CONFIRMED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // const blockLetter = blockIndex ? String.fromCharCode(65 + parseInt(blockIndex)) : 'A';

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={32} color="#f6bd33" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reservation</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
              <Skeleton width="100%" height={50} borderRadius={12} style={{ marginTop: 24 }} />
            </View>
          ) : error && !reservationStatus ? (
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
          ) : (
            <>
              {/* Status Badge */}
              {reservationStatus && (
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(reservationStatus) },
                    ]}
                  >
                    <Text style={styles.statusText}>{reservationStatus}</Text>
                  </View>
                </View>
              )}

              {/* Location Card */}
              {location && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="location-on" size={24} color="#2196F3" />
                    <Text style={styles.cardTitle}>Location</Text>
                  </View>
                  <Text style={styles.cardValue}>{location.name}</Text>
                  {location.city && (
                    <Text style={styles.cardSubValue}>{location.city}</Text>
                  )}
                </View>
              )}

              {/* Gate Card */}
              {gateName && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="door-sliding" size={24} color="#FF9800" />
                    <Text style={styles.cardTitle}>Gate</Text>
                  </View>
                  <Text style={styles.cardValue}>{gateName}</Text>
                </View>
              )}

              {/* Block Card */}
              {/* {blockIndex !== undefined && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="view-module" size={24} color="#4CAF50" />
                    <Text style={styles.cardTitle}>Block</Text>
                  </View>
                  <Text style={styles.cardValue}>Block {blockLetter}</Text>
                  {spotCount && (
                    <Text style={styles.cardSubValue}>{spotCount} spots</Text>
                  )}
                </View>
              )} */}

              {/* Available Vouchers Card - Show before reservation, only if there are unused vouchers */}
              {!reservationStatus && !vouchersLoading && availableVouchers.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeaderWithRight}>
                    <View style={styles.cardHeaderLeft}>
                      <MaterialIcons name="local-offer" size={24} color="#f6bd33" />
                      <Text style={styles.cardTitle}>Available Voucher</Text>
                    </View>
                    <View style={styles.infoIconContainer}>
                      <TouchableOpacity
                        onPress={() => setShowVoucherInfoModal(!showVoucherInfoModal)}
                        activeOpacity={0.7}
                        style={styles.infoIconButton}
                      >
                        <MaterialIcons name="info-outline" size={24} color="#666666" />
                      </TouchableOpacity>
                      {showVoucherInfoModal && (
                        <>
                          <View style={styles.tooltip}>
                            <Text style={styles.tooltipText}>
                              Best available voucher will be automatically applied at checkout
                            </Text>
                          </View>
                          <View style={styles.tooltipArrowBorder} />
                          <View style={styles.tooltipArrow} />
                        </>
                      )}
                    </View>
                  </View>
                  <Text style={styles.cardValue}>
                    {availableVouchers[0].percentage}% discount will be applied
                  </Text>
                  {availableVouchers[0].code && (
                    <Text style={styles.cardSubValue}>Code: {availableVouchers[0].code}</Text>
                  )}
                </View>
              )}

              {/* Pricing Card - Show after reservation is created */}
              {pricing && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="attach-money" size={24} color="#1E3264" />
                    <Text style={styles.cardTitle}>Payment Amount</Text>
                  </View>
                  {pricing.discountAmountJOD && pricing.discountAmountJOD > 0 ? (
                    <>
                      <Text style={styles.originalPrice}>
                        Original: {pricing.baseAmountJOD.toFixed(2)} JOD
                      </Text>
                      <Text style={styles.discountText}>
                        Discount: -{pricing.discountAmountJOD.toFixed(2)} JOD
                      </Text>
                      <Text style={styles.finalPrice}>
                        Total: {pricing.finalAmountJOD.toFixed(2)} JOD
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.finalPrice}>
                      Total: {pricing.finalAmountJOD.toFixed(2)} JOD
                    </Text>
                  )}
                </View>
              )}

              {/* Voucher Applied Card - Show after reservation is created */}
              {appliedVoucher && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="local-offer" size={24} color="#f6bd33" />
                    <Text style={styles.cardTitle}>Voucher Applied</Text>
                  </View>
                  <Text style={styles.cardValue}>
                    {appliedVoucher.percentage}% discount applied
                  </Text>
                  {appliedVoucher.code && (
                    <Text style={styles.cardSubValue}>Code: {appliedVoucher.code}</Text>
                  )}
                </View>
              )}

              {/* Reserve & Pay Button - Single button that handles both creating reservation and proceeding to payment */}
              {!waitingForPayment && reservationStatus !== 'ACTIVE' && (
                <View style={styles.reserveButtonContainer}>
                  {error && (
                    <View style={styles.errorMessageContainer}>
                      <Text style={styles.errorMessageText}>{error}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.reserveButton, reserving && styles.reserveButtonDisabled]}
                    onPress={async () => {
                      // If reservation is already created (PENDING status), proceed to payment
                      if (reservationStatus === 'PENDING' && checkoutUrl) {
                        setReserving(true);
                        setError(null);
                        setWaitingForPayment(true);
                        
                        try {
                          await WebBrowser.openBrowserAsync(checkoutUrl, {
                            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                          });
                        } catch (err) {
                          console.error('Error opening checkout URL:', err);
                          setError('Failed to open payment page. Please try again.');
                          setWaitingForPayment(false);
                        } finally {
                          setReserving(false);
                        }
                      } else {
                        // Create reservation first, then automatically proceed to payment
                        await handleReserve();
                      }
                    }}
                    disabled={reserving}
                    activeOpacity={0.8}
                  >
              {reserving ? (
                <>
                  <ActivityIndicator size="small" color="#1E3264" style={styles.reserveButtonLoader} />
                  <Text style={styles.reserveButtonText}>
                    {reservationStatus === 'PENDING' ? 'Opening Payment...' : 'Creating Reservation...'}
                  </Text>
                </>
              ) : (
                <Text style={styles.reserveButtonText}>
                  {reservationStatus === 'PENDING' ? 'Proceed to Payment' : 'Reserve & Pay'}
                </Text>
              )}
                  </TouchableOpacity>
                </View>
              )}

            </>
          )}
        </ScrollView>

        {/* Payment Waiting Modal */}
        <Modal
          visible={waitingForPayment}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.paymentWaitingModal}>
              <ActivityIndicator size="large" color="#f6bd33" />
              <Text style={styles.paymentWaitingTitle}>Waiting for Payment</Text>
              <Text style={styles.paymentWaitingText}>
                Please complete the payment.
              </Text>
              <Text style={styles.paymentWaitingSubtext}>
                We&apos;ll automatically confirm your reservation once payment is complete.
              </Text>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowSuccessModal(false);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
              <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
              <Text style={styles.successModalTitle}>Reservation Completed!</Text>
              <Text style={styles.successModalText}>
                Your reservation is now active. You can return to the home page.
              </Text>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
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
  statusContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 12,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3264',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  cardSubValue: {
    fontSize: 14,
    color: '#666666',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  finalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3264',
    marginBottom: 4,
  },
  discountText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  reserveButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  errorMessageContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorMessageText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  reserveButton: {
    backgroundColor: '#f6bd33',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reserveButtonDisabled: {
    opacity: 0.6,
  },
  reserveButtonLoader: {
    marginRight: 8,
  },
  reserveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentWaitingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    marginHorizontal: 20,
  },
  paymentWaitingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3264',
    marginTop: 20,
    marginBottom: 12,
  },
  paymentWaitingText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentWaitingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
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
  voucherInfoModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    marginHorizontal: 20,
  },
  voucherInfoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3264',
    marginTop: 16,
    marginBottom: 12,
  },
  voucherInfoModalText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },
});
