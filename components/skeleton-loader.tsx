import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

interface SkeletonCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showLines?: number;
}

export function SkeletonCard({ showImage = false, showTitle = true, showSubtitle = true, showLines = 2 }: SkeletonCardProps) {
  return (
    <View style={styles.cardContainer}>
      {showImage && <Skeleton width={100} height={100} borderRadius={8} style={styles.cardImage} />}
      <View style={styles.cardContent}>
        {showTitle && <Skeleton width="80%" height={20} borderRadius={4} style={styles.cardTitle} />}
        {showSubtitle && <Skeleton width="60%" height={16} borderRadius={4} style={styles.cardSubtitle} />}
        {Array.from({ length: showLines }).map((_, index) => (
          <Skeleton key={index} width="100%" height={14} borderRadius={4} style={styles.cardLine} />
        ))}
      </View>
    </View>
  );
}

export function SkeletonButton({ width = '100%' }: { width?: number | string }) {
  return <Skeleton width={width} height={50} borderRadius={12} />;
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} showImage={false} showLines={2} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  cardContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cardImage: {
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardSubtitle: {
    marginBottom: 12,
  },
  cardLine: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
});
