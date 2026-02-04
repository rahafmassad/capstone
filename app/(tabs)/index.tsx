import { ScreenBackground } from '@/components/screen-background';
import { Skeleton } from '@/components/skeleton-loader';
import { ApiError, getLocations, getMyReservations, getVouchers, Location, Reservation, Voucher } from '@/services/api';
import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function HomeScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]); // Store all locations
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestReservation, setLatestReservation] = useState<Reservation | null>(null);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [hasVouchers, setHasVouchers] = useState(false);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersModalLoading, setVouchersModalLoading] = useState(false);
  const [vouchersModalError, setVouchersModalError] = useState<string | null>(null);
  const [qrCodeHidden, setQrCodeHidden] = useState(false);
  const consumedExpiredTimestampRef = React.useRef<number | null>(null);
  const reservationIdRef = React.useRef<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }
      fetchLocations();
      fetchLatestReservation();
      checkVouchers();
    };
    checkAuth();
  }, []);

  // Refresh vouchers and reservations when screen comes into focus (e.g., after cancelling reservation)
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        const token = await storage.getToken();
        if (token) {
          checkVouchers();
          fetchLatestReservation(); // Refresh reservations to hide cancelled ones
        }
      };
      refreshData();
    }, [])
  );

  // Poll for reservation status to check if QR code was consumed
  // Only poll when there's an active reservation with QR code that hasn't been consumed
  useEffect(() => {
    // Check if we should start polling
    const shouldPoll = latestReservation && 
                       latestReservation.qrToken && 
                       !latestReservation.consumedAt &&
                       latestReservation.status?.toUpperCase() !== 'CANCELLED' &&
                       !latestReservation.cancelledAt;

    if (!shouldPoll) {
      return; // Don't poll if no active reservation or already consumed
    }

    // Poll every 3 seconds to check if QR code was consumed
    const pollInterval = setInterval(async () => {
      try {
        const token = await storage.getToken();
        if (!token) {
          return;
        }

        const response = await getMyReservations(token);
        const reservations = response.reservations || [];
        
        // Find the current reservation by ID
        const currentReservation = reservations.find(r => r.id === latestReservation.id);
        
        if (currentReservation) {
          // Update the reservation state if it changed (e.g., consumed)
          if (currentReservation.consumedAt !== latestReservation.consumedAt) {
            setLatestReservation(currentReservation);
          }
        }
      } catch (err) {
        // Silently fail polling - don't show errors
        console.error('Error polling reservation status:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup interval on unmount or when conditions change
    return () => clearInterval(pollInterval);
  }, [latestReservation]);

  // Check if reservation is consumed and handle 2-minute timer (only for consumed, not expired)
  useEffect(() => {
    if (!latestReservation) {
      setQrCodeHidden(false);
      consumedExpiredTimestampRef.current = null;
      reservationIdRef.current = null;
      return;
    }

    // Reset if reservation ID changed
    if (reservationIdRef.current !== latestReservation.id) {
      consumedExpiredTimestampRef.current = null;
      reservationIdRef.current = latestReservation.id;
      setQrCodeHidden(false);
    }

    const isConsumed = !!latestReservation.consumedAt;
    
    // Only apply hiding logic for consumed QR codes, not expired ones
    if (isConsumed && latestReservation.consumedAt) {
      // Get the timestamp when it was consumed
      const consumedTime = new Date(latestReservation.consumedAt).getTime();
      
      // Only set the timestamp if we haven't already tracked it for this reservation
      if (consumedExpiredTimestampRef.current === null) {
        consumedExpiredTimestampRef.current = consumedTime;
      }

      // Calculate time elapsed since consumption
      const timeElapsed = Date.now() - consumedExpiredTimestampRef.current;
      const twoMinutes = 120000; // 2 minutes in milliseconds

      if (timeElapsed >= twoMinutes) {
        // Already past 2 minutes, hide immediately
        setQrCodeHidden(true);
      } else {
        // Set timer to hide QR code section after remaining time
        const remainingTime = twoMinutes - timeElapsed;
        const timer = setTimeout(() => {
          setQrCodeHidden(true);
        }, remainingTime);

        return () => clearTimeout(timer);
      }
    } else {
      setQrCodeHidden(false);
      consumedExpiredTimestampRef.current = null;
    }
  }, [latestReservation]);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLocations();
      const fetchedLocations = response.locations || [];
      setAllLocations(fetchedLocations);
      setLocations(fetchedLocations);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to load locations. Please try again.';
      setError(errorMessage);
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle text changes in the search bar and filter locations on the fly
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // If search is cleared, show all locations again
    if (!text.trim()) {
      setLocations(allLocations);
      return;
    }

    const query = text.toLowerCase().trim();
    const filtered = allLocations.filter((location) => {
      const nameMatch = location.name?.toLowerCase().includes(query);
      const cityMatch = location.city?.toLowerCase().includes(query);
      const descriptionMatch = location.description?.toLowerCase().includes(query);
      return nameMatch || cityMatch || descriptionMatch;
    });

    setLocations(filtered);
  };

  const fetchLatestReservation = async () => {
    setReservationsLoading(true);
    try {
      const token = await storage.getToken();
      if (!token) {
        return;
      }

      const response = await getMyReservations(token);
      const reservations = response.reservations || [];
      
      // Filter out cancelled reservations - only show active/pending/confirmed reservations
      const activeReservations = reservations.filter((reservation) => {
        const status = reservation.status?.toUpperCase() || '';
        return status !== 'CANCELLED' && status !== 'EXPIRED';
      });
      
      // Get the most recent active reservation (they're already sorted by createdAt DESC)
      if (activeReservations.length > 0) {
        setLatestReservation(activeReservations[0]);
      } else {
        // No active reservations, clear the latest reservation
        setLatestReservation(null);
      }
    } catch (err) {
      const apiError = err as ApiError;
      // Don't show error for reservations, just log it
      console.error('Error fetching reservations:', err);
    } finally {
      setReservationsLoading(false);
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
      const vouchers = response.vouchers || [];
      
      // Also fetch reservations to check if vouchers are linked to active reservations
      const reservationsResponse = await getMyReservations(token);
      const reservations = reservationsResponse.reservations || [];
      const activeReservationIds = new Set(
        reservations
          .filter((r) => {
            const status = r.status?.toUpperCase() || '';
            return status === 'ACTIVE' || status === 'PENDING' || status === 'CONFIRMED';
          })
          .map((r) => r.id)
      );
      
      // Filter out:
      // 1. Used vouchers (used: true or usedAt is set)
      // 2. Expired vouchers
      // 3. Vouchers linked to active reservations (even if not marked as used yet)
      const activeVouchers = vouchers.filter(
        (v) => {
          // Check if voucher is used
          if (v.used || v.usedAt) {
            return false;
          }
          
          // Check if voucher is expired
          if (v.expiresAt && new Date(v.expiresAt) <= new Date()) {
            return false;
          }
          
          // Check if voucher is linked to an active reservation
          if (v.reservationId && activeReservationIds.has(v.reservationId)) {
            return false;
          }
          
          return true;
        }
      );
      
      // Show voucher button only if user has at least one active voucher
      setHasVouchers(activeVouchers.length > 0);
    } catch (err) {
      const apiError = err as ApiError;
      // Don't show error for vouchers, just log it
      console.error('Error fetching vouchers:', err);
      setHasVouchers(false);
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleReservationDetailsPress = () => {
    if (latestReservation) {
      router.push({
        pathname: '/reservation-details',
        params: { reservationId: latestReservation.id },
      });
    }
  };

  const handleVoucherPress = async () => {
    setShowVoucherModal(true);
    await fetchVouchersForModal();
  };

  const fetchVouchersForModal = async () => {
    setVouchersModalLoading(true);
    setVouchersModalError(null);
    try {
      const token = await storage.getToken();
      if (!token) {
        setVouchersModalError('Authentication required');
        return;
      }

      const response = await getVouchers(token);
      const allVouchers = response.vouchers || [];
      
      // Also fetch reservations to check if vouchers are linked to active reservations
      const reservationsResponse = await getMyReservations(token);
      const reservations = reservationsResponse.reservations || [];
      const activeReservationIds = new Set(
        reservations
          .filter((r) => {
            const status = r.status?.toUpperCase() || '';
            return status === 'ACTIVE' || status === 'PENDING' || status === 'CONFIRMED';
          })
          .map((r) => r.id)
      );
      
      // Filter out:
      // 1. Used vouchers (used: true or usedAt is set)
      // 2. Expired vouchers
      // 3. Vouchers linked to active reservations (even if not marked as used yet)
      const activeVouchers = allVouchers.filter(
        (v) => {
          // Check if voucher is used
          if (v.used || v.usedAt) {
            return false;
          }
          
          // Check if voucher is expired
          if (v.expiresAt && new Date(v.expiresAt) <= new Date()) {
            return false;
          }
          
          // Check if voucher is linked to an active reservation
          if (v.reservationId && activeReservationIds.has(v.reservationId)) {
            return false;
          }
          
          return true;
        }
      );
      
      // Sort by percentage (highest first)
      activeVouchers.sort((a, b) => {
        return (b.percentage || 0) - (a.percentage || 0);
      });
      
      // Show only the best active voucher (one voucher maximum)
      setVouchers(activeVouchers.length > 0 ? [activeVouchers[0]] : []);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      const errorMessage = apiError.message || 'Failed to load vouchers. Please try again.';
      setVouchersModalError(errorMessage);
      console.error('Error fetching vouchers:', err);
    } finally {
      setVouchersModalLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
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

  const handlePlacePress = (location: Location) => {
    // Navigate to parking slot selection page with location ID
    router.push({
      pathname: '/parking-slot',
      params: { locationId: location.id },
    });
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top section (logo, search, reservation) on white background */}
        <View style={styles.topSection}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/saffeh-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
          </View>

          {/* Search Bar with voucher ticket icon outside on the right */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={24} color="#666666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for locations..."
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearchChange('')}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={18} color="#999999" />
                </TouchableOpacity>
              )}
            </View>
            {!vouchersLoading && (
              <TouchableOpacity
                style={[
                  styles.voucherIconButton,
                  !hasVouchers && styles.voucherIconButtonDisabled,
                ]}
                onPress={handleVoucherPress}
                activeOpacity={hasVouchers ? 0.85 : 1}
                disabled={!hasVouchers}
              >
                {hasVouchers && (
                  <View style={styles.voucherBadge}>
                    <Text style={styles.voucherBadgeText}>1</Text>
                  </View>
                )}
                <MaterialIcons 
                  name="confirmation-number" 
                  size={20} 
                  color={hasVouchers ? "#FFFFFF" : "#999999"} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* QR Code Section – only show when a reservation exists with qrToken and is not cancelled */}
          {latestReservation && 
           latestReservation.qrToken && 
           latestReservation.status?.toUpperCase() !== 'CANCELLED' &&
           !latestReservation.cancelledAt &&
           !qrCodeHidden && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reservation QR Code</Text>
              <View style={styles.qrCodeContainer}>
                {reservationsLoading ? (
                  <View style={styles.qrCodeSkeletonContainer}>
                    <Skeleton width={200} height={200} borderRadius={12} />
                    <Skeleton width={150} height={16} borderRadius={4} style={{ marginTop: 16 }} />
                    <Skeleton width={120} height={40} borderRadius={12} style={{ marginTop: 16 }} />
                  </View>
                ) : (
                  <>
                    <View style={styles.qrCodeWrapper}>
                      <QRCode
                        value={latestReservation.qrToken}
                        size={200}
                        color="#1E3264"
                        backgroundColor="#FFFFFF"
                      />
                      {/* Overlay for consumed/expired QR codes */}
                      {(latestReservation.consumedAt || (latestReservation.validUntil && new Date(latestReservation.validUntil) < new Date())) && (
                        <View style={styles.qrCodeOverlay}>
                          <Text style={styles.qrCodeOverlayText}>
                            {latestReservation.consumedAt ? 'CONSUMED' : 'EXPIRED'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.qrCodeLabel}>Scan at the gate to enter</Text>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={handleReservationDetailsPress}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewDetailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Places Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.suggestionsTitle]}>Suggestions</Text>
          {loading ? (
            <View style={styles.placesGrid}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.placeCard}>
                  <Skeleton width="100%" height={100} borderRadius={8} style={{ marginBottom: 10 }} />
                  <Skeleton width="80%" height={18} borderRadius={4} style={{ marginBottom: 5 }} />
                  <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                  <Skeleton width="100%" height={12} borderRadius={4} />
                </View>
              ))}
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchLocations}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : locations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No locations available</Text>
            </View>
          ) : (
            <View style={styles.placesGrid}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.placeCard}
                  onPress={() => handlePlacePress(location)}
                  activeOpacity={0.8}
                >
                  <View style={styles.placeImage}>
                    <MaterialIcons name="location-on" size={40} color="#1E3264" />
                  </View>
                  <Text style={styles.placeName} numberOfLines={2}>
                    {location.name}
                  </Text>
                  {location.city && (
                    <Text style={styles.placeTime} numberOfLines={1}>
                      {location.city}
                    </Text>
                  )}
                  {location.description && (
                    <Text style={styles.placeDescription} numberOfLines={2}>
                      {location.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Voucher Modal */}
      <Modal
        visible={showVoucherModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.voucherModal}>
            {/* Header with close button */}
            <View style={styles.voucherModalHeader}>
              <Text style={styles.voucherModalTitle}>My Vouchers</Text>
              <TouchableOpacity
                style={styles.voucherModalCloseButton}
                onPress={() => setShowVoucherModal(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color="#1E3264" />
              </TouchableOpacity>
            </View>

            {/* Voucher Content */}
            <ScrollView
              style={styles.voucherModalScroll}
              contentContainerStyle={styles.voucherModalContent}
              showsVerticalScrollIndicator={false}
            >
              {vouchersModalLoading ? (
                <View style={styles.voucherSkeletonContainer}>
                  <View style={styles.voucherTicket}>
                    <View style={styles.ticketNotchLeft} />
                    <View style={styles.ticketNotchRight} />
                    <View style={styles.ticketContentRow}>
                      <View style={styles.ticketIconColumn}>
                        <Skeleton width={60} height={60} borderRadius={30} />
                        <Skeleton width={40} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                      </View>
                      <View style={styles.ticketMainColumn}>
                        <Skeleton width={120} height={32} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width={60} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
                        <Skeleton width={80} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
                        <Skeleton width={200} height={14} borderRadius={4} />
                      </View>
                      <View style={styles.ticketStatusColumn}>
                        <Skeleton width={60} height={24} borderRadius={12} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : vouchersModalError ? (
                <View style={styles.voucherErrorContainer}>
                  <MaterialIcons name="error-outline" size={48} color="#F44336" />
                  <Text style={styles.voucherErrorText}>{vouchersModalError}</Text>
                  <TouchableOpacity
                    style={styles.voucherRetryButton}
                    onPress={fetchVouchersForModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.voucherRetryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : vouchers.length === 0 ? (
                <View style={styles.voucherEmptyContainer}>
                  <MaterialIcons name="confirmation-number" size={64} color="#f6bd33" />
                  <Text style={styles.voucherEmptyTitle}>No vouchers available</Text>
                </View>
              ) : (
                <View style={styles.voucherContent}>
                  {vouchers.map((voucher) => (
                    <View key={voucher.id} style={styles.voucherTicket}>
                      {/* Left ticket notch */}
                      <View style={styles.ticketNotchLeft} />
                      {/* Right ticket notch */}
                      <View style={styles.ticketNotchRight} />

                      <View style={styles.ticketContentRow}>
                        <View style={styles.ticketIconColumn}>
                          <View style={styles.ticketIconCircle}>
                            <MaterialIcons name="confirmation-number" size={32} color="#FF8A1F" />
                          </View>
                          {/* <Text style={styles.ticketLabel}>Voucher</Text> */}
                        </View>

                        <View style={styles.ticketMainColumn}>
                          <Text style={styles.ticketPercentage}>{voucher.percentage}% OFF</Text>
                          <Text style={styles.ticketCodeLabel}>Code</Text>
                          <Text style={styles.ticketCode}>{voucher.code || 'N/A'}</Text>

                          <View style={styles.ticketInfoRow}>
                            {voucher.expiresAt && (
                              <View style={styles.ticketInfoItem}>
                                <MaterialIcons name="event" size={16} color="#FFE9B3" />
                                <Text style={styles.ticketInfoLabel}>Expires</Text>
                                <Text style={styles.ticketInfoValue}>
                                  {formatDate(voucher.expiresAt)}
                                </Text>
                              </View>
                            )}

                            {voucher.usedAt && (
                              <View style={styles.ticketInfoItem}>
                                <MaterialIcons name="check-circle" size={16} color="#FFE9B3" />
                                <Text style={styles.ticketInfoLabel}>Used on</Text>
                                <Text style={styles.ticketInfoValue}>
                                  {formatDate(voucher.usedAt)}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.ticketStatusColumn}>
                          <View
                            style={[
                              styles.ticketStatusBadge,
                              voucher.used ? styles.ticketStatusUsed : styles.ticketStatusActive,
                            ]}
                          >
                            <Text style={styles.ticketStatusText}>
                              {voucher.used ? 'USED' : 'ACTIVE'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 85,
  },
  topSection: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    padding: 0,
  },
  clearButton: {
    paddingHorizontal: 6,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 15,
  },
  suggestionsTitle: {
    color: '#FFFFFF',
  },
  reservationButton: {
    backgroundColor: '#1E3264',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 56,
  },
  reservationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  placeCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  placeImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  placeTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  placeDescription: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
    lineHeight: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  voucherIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f6bd33',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  voucherIconButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  voucherBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f6bd33',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  voucherModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  voucherModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3264',
  },
  voucherModalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherModalScroll: {
    flex: 1,
  },
  voucherModalContent: {
    padding: 16,
  },
  voucherSkeletonContainer: {
    width: '100%',
  },
  voucherLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  voucherLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  voucherErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  voucherErrorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 24,
  },
  voucherRetryButton: {
    backgroundColor: '#1E3264',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  voucherRetryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  voucherEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  voucherEmptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
  },
  voucherContent: {
    gap: 20,
  },
  voucherTicket: {
    backgroundColor: '#f6bd33',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  ticketNotchLeft: {
    position: 'absolute',
    left: -18,
    top: '40%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
  },
  ticketNotchRight: {
    position: 'absolute',
    right: -18,
    top: '40%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
  },
  ticketContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIconColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  ticketIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE9B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ticketLabel: {
  //   marginTop: 6,
  //   fontSize: 12,
  //   fontWeight: '600',
  //   color: '#4A2A00',
  //   textTransform: 'uppercase',
  // },
  ticketMainColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  ticketPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ticketCodeLabel: {
    fontSize: 12,
    color: '#FFE9B3',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  ticketCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  ticketInfoItem: {
    flex: 1,
  },
  ticketInfoLabel: {
    fontSize: 11,
    color: '#FFE9B3',
  },
  ticketInfoValue: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  ticketStatusColumn: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  ticketStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1E3264',
  },
  ticketStatusActive: {
    backgroundColor: '#4CAF50',
  },
  ticketStatusUsed: {
    backgroundColor: '#4A4A4A',
  },
  ticketStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qrCodeSkeletonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'center',
    elevation: 3,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    // borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  qrCodeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  qrCodeOverlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  qrCodeLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f6bd33',
  },
  viewDetailsButtonText: {
    color: '#1E3264',
    fontSize: 14,
    fontWeight: '600',
  },
});
