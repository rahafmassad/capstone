import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode, useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type HomeBackgroundProps = {
  children: ReactNode;
};

/**
 * Animated home screen background:
 * - Deep navy base only
 * - Soft moving blue highlight for a simple, calm motion effect
 */
export function HomeBackground({ children }: HomeBackgroundProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];

  // Shared value for vertical movement of the light texture
  const beamOffset = useSharedValue(0);

  useEffect(() => {
    beamOffset.value = withRepeat(
      withTiming(1, {
        duration: 6000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [beamOffset]);

  const animatedBeamStyle = useAnimatedStyle(() => {
    const translateY = (beamOffset.value - 0.5) * SCREEN_HEIGHT * 0.25;
    return {
      transform: [{ translateY }],
      opacity: 0.65,
    };
  });

  return (
    <View style={styles.root}>
      {/* Solid navy base */}
      <View style={[styles.baseLayer, { backgroundColor: palette.navy }]} />

      {/* Subtle animated blue glow */}
      <Animated.View style={[styles.beamContainer, animatedBeamStyle]}>
        <LinearGradient
          colors={['rgba(73, 89, 161, 0.85)', 'rgba(11, 16, 48, 0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.beam}
        />
      </Animated.View>

      {/* Content sits above background */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  baseLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  beamContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.05,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  beam: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  content: {
    flex: 1,
  },
});


