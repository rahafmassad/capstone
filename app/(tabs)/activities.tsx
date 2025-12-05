import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getActivities, Activity, ApiError } from '@/services/api';
import { storage } from '@/utils/storage';

type SortOption = 'all' | 'newest' | 'oldest';

export default function ActivitiesScreen() {
  const router = useRouter();
  const [selectedSort, setSelectedSort] = useState<SortOption>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and fetch activities on component mount and when sort changes
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      if (selectedSort !== 'all') {
        fetchActivities(selectedSort);
      } else {
        // For 'all', fetch with 'newest' as default
        fetchActivities('newest');
      }
    };

    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Activities</Text>
        
        {/* Sorting Buttons */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              selectedSort === 'all' && styles.sortButtonSelected,
            ]}
            onPress={() => handleSortChange('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortButtonText,
                selectedSort === 'all' && styles.sortButtonTextSelected,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              selectedSort === 'newest' && styles.sortButtonSelected,
            ]}
            onPress={() => handleSortChange('newest')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortButtonText,
                selectedSort === 'newest' && styles.sortButtonTextSelected,
              ]}
            >
              Newest to oldest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              selectedSort === 'oldest' && styles.sortButtonSelected,
            ]}
            onPress={() => handleSortChange('oldest')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortButtonText,
                selectedSort === 'oldest' && styles.sortButtonTextSelected,
              ]}
            >
              Oldest to newest
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activities Heading */}
        <Text style={styles.activitiesHeading}>Activities</Text>

        {/* Activities List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3264" />
            <Text style={styles.loadingText}>Loading activities...</Text>
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
            <Text style={styles.emptyText}>No activities found</Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  {/* Circular placeholder */}
                </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  sortContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  sortButton: {
    flex: 1,
    backgroundColor: '#f6bd33',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonSelected: {
    backgroundColor: '#1E3264',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  sortButtonTextSelected: {
    color: '#FFFFFF',
  },
  activitiesHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
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
    backgroundColor: '#E0E0E0',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  activityDateTime: {
    fontSize: 14,
    color: '#666666',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

