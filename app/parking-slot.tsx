import { Skeleton } from '@/components/skeleton-loader';
import { ApiError, Gate, getGateSpots, getLocationGates, Location, SpotWithStatus } from '@/services/api';
import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ParkingSlotScreen() {
  const router = useRouter();
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [spots, setSpots] = useState<SpotWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [gatesLoading, setGatesLoading] = useState(false);
  const [spotsLoading, setSpotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [gatesWithNoSpots, setGatesWithNoSpots] = useState<Set<string>>(new Set());
  const [isFocused, setIsFocused] = useState(true);
  const gatesScrollRef = useRef<ScrollView>(null);
  const blocksScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (locationId) {
      fetchLocationAndGates();
    }
  }, [locationId]);

  // After fetching gates, check availability for all gates
  useEffect(() => {
    if (gates.length > 0) {
      const checkAllGatesAvailability = async () => {
        setGatesLoading(true);
        const token = await storage.getToken();
        if (!token) {
          setGatesLoading(false);
          return;
        }

        const unavailableGates = new Set<string>();
        
        // Check each gate for available spots
        for (const gate of gates) {
          try {
            const response = await getGateSpots(gate.id, token);
            const hasAvailableSpots = response.spots?.some(spot => 
              spot.cvStatus?.toUpperCase() === 'FREE' && spot.status === 'FREE'
            );
            
            if (!hasAvailableSpots || response.spots?.length === 0) {
              unavailableGates.add(gate.id);
            }
          } catch {
            // If we can't fetch spots, assume gate is unavailable
            unavailableGates.add(gate.id);
          }
        }
        
        setGatesWithNoSpots(unavailableGates);
        setGatesLoading(false);
      };

      checkAllGatesAvailability();
    }
  }, [gates]);

  // Auto-select first available gate
  useEffect(() => {
    if (gates.length > 0 && !selectedGate) {
      // Find first gate that has available spots
      const firstAvailableGate = gates.find(gate => !gatesWithNoSpots.has(gate.id)) || gates[0];
      setSelectedGate(firstAvailableGate);
      fetchSpots(firstAvailableGate.id, true);
    }
  }, [gates, gatesWithNoSpots]);

  // Update spots when gate changes
  useEffect(() => {
    if (selectedGate) {
      fetchSpots(selectedGate.id, true);
      setSelectedBlock(null);
    }
  }, [selectedGate]);

  // Track screen focus state
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  // Poll for spots updates when a gate is selected (real-time updates)
  // Only poll when the screen is focused
  useEffect(() => {
    if (!selectedGate || !isFocused) {
      return;
    }

    const pollForSpots = async () => {
      try {
        const token = await storage.getToken();
        if (!token) {
          router.replace('/welcome');
          return;
        }

        const response = await getGateSpots(selectedGate.id, token);
        setSpots(response.spots || []);
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.status === 401) {
          await storage.clearAuth();
          router.replace('/welcome');
          return;
        }
        // Silently fail for polling - don't show errors for background updates
        console.error('Error polling spots:', err);
      }
    };

    // Poll every 2 seconds for real-time updates
    const interval = setInterval(pollForSpots, 2000);
    // Start polling immediately (after a small delay to let initial fetch complete)
    const timeout = setTimeout(pollForSpots, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [selectedGate, isFocused]);

  // Poll for gates availability updates periodically
  // Only poll when the screen is focused
  useEffect(() => {
    if (gates.length === 0 || !isFocused) {
      return;
    }

    const pollForGatesAvailability = async () => {
      try {
        const token = await storage.getToken();
        if (!token) {
          return;
        }

        const unavailableGates = new Set<string>();
        
        // Check each gate for available spots
        for (const gate of gates) {
          try {
            const response = await getGateSpots(gate.id, token);
            const hasAvailableSpots = response.spots?.some(spot => 
              spot.cvStatus?.toUpperCase() === 'FREE' && spot.status === 'FREE'
            );
            
            if (!hasAvailableSpots || response.spots?.length === 0) {
              unavailableGates.add(gate.id);
            }
          } catch {
            // If we can't fetch spots, assume gate is unavailable
            unavailableGates.add(gate.id);
          }
        }
        
        setGatesWithNoSpots(unavailableGates);
      } catch (err) {
        // Silently fail for polling - don't show errors for background updates
        console.error('Error polling gates availability:', err);
      }
    };

    // Poll every 3 seconds for gates availability
    const interval = setInterval(pollForGatesAvailability, 3000);
    // Start polling after initial check completes
    const timeout = setTimeout(pollForGatesAvailability, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [gates, isFocused]);

  // Auto-select first block when spots are loaded
  useEffect(() => {
    if (spots.length > 0 && selectedBlock === null) {
      setSelectedBlock(0);
    }
  }, [spots]);

  const fetchLocationAndGates = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      const response = await getLocationGates(locationId!, token);
      setLocation(response.location);
      setGates(response.gates || []);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      setError(apiError.message || 'Failed to load location details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpots = async (gateId: string, showLoading: boolean = true) => {
    if (showLoading) {
      setSpotsLoading(true);
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
      if (showLoading) {
        setError('Failed to load spots. Please try again.');
      }
    } finally {
      if (showLoading) {
        setSpotsLoading(false);
      }
    }
  };

  const handleGatePress = (gate: Gate) => {
    setSelectedGate(gate);
    setSelectedBlock(null);
  };

  const handleBlockSelect = (blockIndex: number) => {
    setSelectedBlock(blockIndex);
  };

  const handleSelect = () => {
    if (!selectedGate || !locationId) {
      setError('Please select a gate and block');
      return;
    }

    const blocks = groupSpotsIntoBlocks(spots);
    const selectedBlockSpots = blocks[selectedBlock || 0] || [];
    
    router.push({
      pathname: '/reservation',
      params: {
        locationId: locationId,
        gateId: selectedGate.id,
        gateName: selectedGate.name,
        blockIndex: selectedBlock?.toString() || '0',
        spotCount: selectedBlockSpots.length.toString(),
      },
    });
  };

  // Group spots into blocks (12 spots per block: 6 top, 6 bottom)
  const groupSpotsIntoBlocks = (spotsList: SpotWithStatus[]) => {
    const blocks: SpotWithStatus[][] = [];
    for (let i = 0; i < spotsList.length; i += 12) {
      blocks.push(spotsList.slice(i, i + 12));
    }
    return blocks;
  };

  // Get spots for a specific block
  const getBlockSpots = (blockIndex: number) => {
    const blocks = groupSpotsIntoBlocks(spots);
    return blocks[blockIndex] || [];
  };

  // Count available spots in a block
  const getAvailableSpotsCount = (blockIndex: number) => {
    const blockSpots = getBlockSpots(blockIndex);
    return blockSpots.filter(spot => spot.cvStatus?.toUpperCase() === 'FREE' && spot.status === 'FREE').length;
  };

  const handleBack = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={200} height={32} borderRadius={8} />
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Skeleton width={100} height={24} borderRadius={4} style={{ marginBottom: 16 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} width={120} height={50} borderRadius={12} style={{ marginRight: 12 }} />
              ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            <Skeleton width={100} height={24} borderRadius={4} style={{ marginBottom: 16 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} width={100} height={50} borderRadius={12} style={{ marginRight: 12 }} />
              ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            <Skeleton width={250} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={300} borderRadius={16} />
          </View>
          <View style={styles.selectButtonContainer}>
            <Skeleton width="100%" height={50} borderRadius={12} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={32} color="#f6bd33" />
        </TouchableOpacity>
        <Text style={styles.title}>Parking Slot</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Gates Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gates</Text>
          {gatesLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gatesSliderContent}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} width={120} height={50} borderRadius={12} style={{ marginRight: 12 }} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.sliderWrapper}>
              <ScrollView
                ref={gatesScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gatesSliderContent}
              >
              {gates.map((gate) => {
                const isSelected = selectedGate?.id === gate.id;
                const hasNoSpots = gatesWithNoSpots.has(gate.id);
                return (
                  <TouchableOpacity
                    key={gate.id}
                    style={[
                      styles.gateButton,
                      isSelected && styles.gateButtonSelected,
                      hasNoSpots && styles.gateButtonUnavailable,
                    ]}
                    onPress={() => handleGatePress(gate)}
                    activeOpacity={hasNoSpots ? 1 : 0.8}
                    disabled={hasNoSpots}
                  >
                    {/* <MaterialIcons
                      name="door-sliding"
                      size={24}
                      color={
                        hasNoSpots 
                          ? '#999999' 
                          : isSelected 
                            ? '#1E3264' 
                            : '#FFFFFF'
                      }
                    /> */}
                    <Text
                      style={[
                        styles.gateButtonText,
                        hasNoSpots && styles.gateButtonTextUnavailable,
                      ]}
                    >
                      {gate.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Blocks Slider */}
        {selectedGate && spots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blocks</Text>
            {spotsLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderContent}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} width={100} height={50} borderRadius={12} style={{ marginRight: 12 }} />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.sliderWrapper}>
                <ScrollView
                  ref={blocksScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  // contentContainerStyle={styles.sliderContent}
                >
                {groupSpotsIntoBlocks(spots).map((block, blockIndex) => {
                  const isSelected = selectedBlock === blockIndex;
                  const availableCount = getAvailableSpotsCount(blockIndex);
                  const hasNoSpots = availableCount === 0;
                  return (
                    <TouchableOpacity
                      key={blockIndex}
                      style={[
                        styles.blockButton,
                        isSelected && styles.blockButtonSelected,
                        hasNoSpots && styles.blockButtonUnavailable,
                      ]}
                      onPress={() => handleBlockSelect(blockIndex)}
                      activeOpacity={hasNoSpots ? 1 : 0.8}
                      disabled={hasNoSpots}
                    >
                      <Text
                        style={[
                          styles.blockButtonText,
                          hasNoSpots && styles.blockButtonTextUnavailable,
                        ]}
                      >
                        Block {String.fromCharCode(65 + blockIndex)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Available Spots Count */}
        {selectedGate && selectedBlock !== null && (
          <View style={styles.section}>
            <Text style={styles.spotsCountText}>
              {getAvailableSpotsCount(selectedBlock)} spots available
            </Text>
          </View>
        )}

        {/* Parking Illustration */}
        {selectedGate && selectedBlock !== null && (
          <View style={styles.section}>
            <View style={styles.parkingLayoutContainer}>
              <View style={styles.parkingSpotsLayout}>
                {(() => {
                  const blockSpots = getBlockSpots(selectedBlock);
                  const topRow = blockSpots.slice(0, 6);
                  const bottomRow = blockSpots.slice(6, 12);

                  return (
                    <>
                      {/* Top Row */}
                      <View style={styles.parkingRow}>
                        {topRow.map((spot) => {
                          const isFree = spot.cvStatus?.toUpperCase() === 'FREE' && spot.status === 'FREE';
                          return (
                            <View
                              key={spot.id}
                              style={[
                                styles.parkingSpot,
                                !isFree && styles.parkingSpotOccupied,
                              ]}
                            >
                              {isFree ? (
                                <Text style={styles.spotLabel}>{spot.number ?? 'N/A'}</Text>
                              ) : (
                                <View style={styles.occupiedCarContainer}>
                                  <View style={styles.occupiedCarOverlay} />
                                  <Image
                                    source={require('@/assets/images/car.png')}
                                    style={styles.carImage}
                                    contentFit="contain"
                                  />
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>

                      {/* Path/Dividers with Entry Car */}
                      <View style={styles.pathDivider}>
                        <View style={styles.entryCarContainer}>
                          <Image
                            source={require('@/assets/images/car.png')}
                            style={styles.entryCar}
                            contentFit="contain"
                          />
                        </View>
                        <View style={styles.pathLine}>
                          {Array.from({ length: 12 }).map((_, index) => (
                            <View key={index} style={styles.dash} />
                          ))}
                        </View>
                        <MaterialIcons name="arrow-forward" size={20} color="#CCCCCC" />
                      </View>

                      {/* Bottom Row */}
                      <View style={styles.parkingRow}>
                        {bottomRow.map((spot) => {
                          const isFree = spot.cvStatus?.toUpperCase() === 'FREE' && spot.status === 'FREE';
                          return (
                            <View
                              key={spot.id}
                              style={[
                                styles.parkingSpot,
                                !isFree && styles.parkingSpotOccupied,
                              ]}
                            >
                              {isFree ? (
                                <Text style={styles.spotLabel}>{spot.number ?? 'N/A'}</Text>
                              ) : (
                                <View style={styles.occupiedCarContainer}>
                                  <View style={styles.occupiedCarOverlay} />
                                  <Image
                                    source={require('@/assets/images/car.png')}
                                    style={styles.carImage}
                                    contentFit="contain"
                                  />
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          </View>
        )}

        {/* Select Button */}
        {selectedGate && selectedBlock !== null && (
          <View style={styles.selectButtonContainer}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelect}
              activeOpacity={0.8}
            >
              <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3264',
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
  title: {
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
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sliderWrapper: {
    marginHorizontal: -20, // Extend beyond section padding
    paddingHorizontal: 20, // Restore padding for content
  },
  sliderContent: {
    paddingRight: SCREEN_WIDTH * 0.25, // Show quarter of next button to indicate scrollable
  },
  gatesSliderContent: {
    paddingLeft: 0, // No left padding since wrapper handles it
  },
  gateButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(128, 128, 128, 0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // minWidth: 120,
  },
  gateButtonSelected: {
    backgroundColor: '#f6bd33',
    borderColor: '#f6bd33',
  },
  gateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gateButtonUnavailable: {
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
    borderColor: 'rgba(100, 100, 100, 0.6)',
    opacity: 0.6,
  },
  gateButtonTextUnavailable: {
    color: '#999999',
  },
  blockButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(128, 128, 128, 0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockButtonSelected: {
    backgroundColor: '#f6bd33',
    borderColor: '#f6bd33',
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  blockButtonUnavailable: {
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
    borderColor: 'rgba(100, 100, 100, 0.6)',
    opacity: 0.6,
  },
  blockButtonTextUnavailable: {
    color: '#999999',
  },
  spotsCountText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  parkingLayoutContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  parkingSpotsLayout: {
    width: '100%',
  },
  parkingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  parkingSpot: {
    width: (SCREEN_WIDTH - 72) / 6 - 4,
    height: 60,
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  parkingSpotOccupied: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  spotLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  occupiedCarContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  occupiedCarOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    borderRadius: 6,
  },
  carImage: {
    width: 40,
    height: 40,
    transform: [{ rotate: '90deg' }],
  },
  pathDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  entryCarContainer: {
    width: 40,
    height: 40,
  },
  entryCar: {
    width: 40,
    height: 40,
  },
  pathLine: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  dash: {
    width: 8,
    height: 2,
    backgroundColor: '#CCCCCC',
  },
  selectButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  selectButton: {
    backgroundColor: '#f6bd33',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
