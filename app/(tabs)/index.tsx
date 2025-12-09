import { ApiError, getLocations, getMyReservations, getVouchers, Location, Reservation } from '@/services/api';
import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

  // Refresh vouchers when screen comes into focus (e.g., after cancelling reservation)
  useFocusEffect(
    React.useCallback(() => {
      const refreshVouchers = async () => {
        const token = await storage.getToken();
        if (token) {
          checkVouchers();
        }
      };
      refreshVouchers();
    }, [])
  );

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

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) {
      return allLocations;
    }

    const query = searchQuery.toLowerCase().trim();
    return allLocations.filter((location) => {
      const nameMatch = location.name?.toLowerCase().includes(query);
      const cityMatch = location.city?.toLowerCase().includes(query);
      const descriptionMatch = location.description?.toLowerCase().includes(query);
      return nameMatch || cityMatch || descriptionMatch;
    });
  }, [searchQuery, allLocations]);

  // Update displayed locations when filtered results change
  useEffect(() => {
    setLocations(filteredLocations);
  }, [filteredLocations]);

  const fetchLatestReservation = async () => {
    setReservationsLoading(true);
    try {
      const token = await storage.getToken();
      if (!token) {
        return;
      }

      const response = await getMyReservations(token);
      const reservations = response.reservations || [];
      
      // Get the most recent reservation (they're already sorted by createdAt DESC)
      if (reservations.length > 0) {
        setLatestReservation(reservations[0]);
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
      
      // Show voucher button if user has any vouchers
      setHasVouchers(vouchers.length > 0);
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

  const handleVoucherPress = () => {
    router.push('/voucher');
  };

  const handlePlacePress = (location: Location) => {
    // Navigate to reservation page with location ID
    router.push({
      pathname: '/reservation',
      params: { locationId: location.id },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for locations..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Reservation Details Button Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reservation Details</Text>
          <TouchableOpacity
            style={styles.reservationButton}
            onPress={handleReservationDetailsPress}
            disabled={!latestReservation || reservationsLoading}
            activeOpacity={0.8}
          >
            {reservationsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="receipt-long" size={24} color="#FFFFFF" />
                <Text style={styles.reservationButtonText}>
                  {latestReservation ? 'View Reservation Details' : 'No Reservations'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Voucher Button Section - Only show if user has vouchers */}
        {hasVouchers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vouchers</Text>
            <TouchableOpacity
              style={styles.voucherButton}
              onPress={handleVoucherPress}
              disabled={vouchersLoading}
              activeOpacity={0.8}
            >
              {vouchersLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="card-giftcard" size={24} color="#FFFFFF" />
                  <Text style={styles.voucherButtonText}>View Vouchers</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Places Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E3264" />
              <Text style={styles.loadingText}>Loading locations...</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
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
  voucherButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 56,
  },
  voucherButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
