import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ScreenBackgroundProps = {
  children: ReactNode;
};

/**
 * Simple dark blue background with a soft animated glow.
 *
 * Wrap your screen content with this component and keep the screen's root
 * container background transparent so the styling shows through.
 */
export function ScreenBackground({ children }: ScreenBackgroundProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];

  return (
    <View style={styles.root}>
      {/* Base navy surface */}
      <View style={[styles.baseLayer, { backgroundColor: palette.navy }]} />

      {/* Soft, subtle blue glow */}
      <LinearGradient
        colors={['rgba(70, 90, 180, 0.45)', 'transparent']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.glow}
      />

      {/* Content */}
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
  glow: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.1,
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_HEIGHT * 1.2,
  },
  content: {
    flex: 1,
  },
});


