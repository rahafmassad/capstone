import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
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
import { getVouchers, Voucher, ApiError } from '@/services/api';
import { storage } from '@/utils/storage';

export default function VoucherScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await getVouchers(token);
      setVouchers(response.vouchers || []);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      const errorMessage = apiError.message || 'Failed to load vouchers. Please try again.';
      setError(errorMessage);
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
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

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1E3264" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vouchers</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3264" />
            <Text style={styles.loadingText}>Loading vouchers...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchVouchers}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="card-giftcard" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Vouchers</Text>
            <Text style={styles.emptyText}>You don't have any vouchers yet.</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {vouchers.map((voucher) => (
              <View key={voucher.id} style={styles.voucherCard}>
                <View style={styles.voucherHeader}>
                  <View style={styles.voucherIconContainer}>
                    <MaterialIcons name="card-giftcard" size={32} color="#FF6B35" />
                  </View>
                  <View style={styles.voucherHeaderContent}>
                    <Text style={styles.voucherCode}>{voucher.code || 'N/A'}</Text>
                    <View style={styles.voucherStatusContainer}>
                      <View
                        style={[
                          styles.voucherStatusBadge,
                          voucher.used
                            ? styles.voucherStatusUsed
                            : styles.voucherStatusActive,
                        ]}
                      >
                        <Text style={styles.voucherStatusText}>
                          {voucher.used ? 'Used' : 'Active'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.voucherDetails}>
                  <View style={styles.voucherDetailRow}>
                    <MaterialIcons name="percent" size={20} color="#666666" />
                    <Text style={styles.voucherDetailLabel}>Discount:</Text>
                    <Text style={styles.voucherDetailValue}>{voucher.percentage}%</Text>
                  </View>

                  {voucher.expiresAt && (
                    <View style={styles.voucherDetailRow}>
                      <MaterialIcons name="event" size={20} color="#666666" />
                      <Text style={styles.voucherDetailLabel}>Expires:</Text>
                      <Text style={styles.voucherDetailValue}>
                        {formatDate(voucher.expiresAt)}
                      </Text>
                    </View>
                  )}

                  {voucher.usedAt && (
                    <View style={styles.voucherDetailRow}>
                      <MaterialIcons name="check-circle" size={20} color="#666666" />
                      <Text style={styles.voucherDetailLabel}>Used On:</Text>
                      <Text style={styles.voucherDetailValue}>
                        {formatDate(voucher.usedAt)}
                      </Text>
                    </View>
                  )}
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  content: {
    gap: 16,
  },
  voucherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  voucherIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherHeaderContent: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3264',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  voucherStatusContainer: {
    flexDirection: 'row',
  },
  voucherStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voucherStatusActive: {
    backgroundColor: '#E8F5E9',
  },
  voucherStatusUsed: {
    backgroundColor: '#F5F5F5',
  },
  voucherStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  voucherDetails: {
    gap: 12,
  },
  voucherDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voucherDetailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  voucherDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
});

