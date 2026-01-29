import { ScreenBackground } from '@/components/screen-background';
import { Skeleton } from '@/components/skeleton-loader';
import { Activity, ApiError, getActivities } from '@/services/api';
import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SortOption = 'all' | 'newest' | 'oldest';

export default function ActivitiesScreen() {
  const router = useRouter();
  const [selectedSort, setSelectedSort] = useState<SortOption>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch activities on component mount and when sort changes
  useEffect(() => {
    if (selectedSort !== 'all') {
      fetchActivities(selectedSort);
    } else {
      // For 'all', fetch with 'newest' as default
      fetchActivities('newest');
    }
  }, [selectedSort]);

  const fetchActivities = async (sort: 'newest' | 'oldest') => {
    setLoading(true);
    setError(null);
    try {
      const token = await storage.getToken();
      if (!token) {
        // No token, redirect to login
        console.warn('No token found, redirecting to login');
        router.replace('/welcome');
        return;
      }

      console.log('Fetching activities with token length:', token ? token.length : 0);
      const response = await getActivities(token, sort);
      setActivities(response.activities || []);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        // Unauthorized, clear storage and redirect to login
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      const errorMessage = apiError.message || 'Failed to load activities. Please try again.';
      setError(errorMessage);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (sort: SortOption) => {
    setSelectedSort(sort);
    setShowFilterModal(false);
  };

  // Format activity action for display
  const formatActivityName = (action: string): string => {
    // Convert action like "RESERVATION_CREATED_PENDING_PAYMENT" to readable text
    return action
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format date for display
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title with Filter Icon */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Activities</Text>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(!showFilterModal)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="filter-list" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Activities List */}
        {loading ? (
          <View style={styles.activitiesList}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={styles.activityItem}>
                <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: 16 }} />
                <View style={styles.activityContent}>
                  <Skeleton width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                  <Skeleton width="50%" height={14} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchActivities(selectedSort === 'all' ? 'newest' : selectedSort)}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyHeading}>No activities here.</Text>
            <Text style={styles.emptyText}>
              There are no activities to display.{'\n'}
              Reserve a parking slot to check your activities!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Reserve a parking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <Image
                  source={require('@/assets/images/activity.png')}
                  style={styles.activityIcon}
                  contentFit="cover"
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>
                    {formatActivityName(activity.action)}
                  </Text>
                  <Text style={styles.activityDateTime}>
                    {formatDateTime(activity.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Filter Dropdown - Outside ScrollView to appear on top */}
      {showFilterModal && (
        <View style={styles.filterDropdownContainer}>
          <View style={styles.filterDropdown}>
            {/* Triangle pointing up */}
            <View style={styles.triangle} />
            
            {/* Header with X button */}
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {/* All Option */}
            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => handleSortChange('all')}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selectedSort === 'all' && styles.checkboxChecked]}>
                {selectedSort === 'all' && (
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>All</Text>
            </TouchableOpacity>

            {/* Newest to Oldest Option */}
            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => handleSortChange('newest')}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selectedSort === 'newest' && styles.checkboxChecked]}>
                {selectedSort === 'newest' && (
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Newest to oldest</Text>
            </TouchableOpacity>

            {/* Oldest to Newest Option */}
            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => handleSortChange('oldest')}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selectedSort === 'oldest' && styles.checkboxChecked]}>
                {selectedSort === 'oldest' && (
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Oldest to newest</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    flex: 1,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f6bd33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDropdownContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 9999,
    elevation: 10,
  },
  filterDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  triangle: {
    position: 'absolute',
    top: -8,
    right: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3264',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1E3264',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1E3264',
    borderColor: '#1E3264',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  activitiesList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityDateTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.63)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 400,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#f6bd33',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3264',
  },
});

