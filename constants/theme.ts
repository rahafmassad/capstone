/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/**
 * Global color system inspired by the automotive artwork:
 * deep navy roads, bold orange beams, and warm golden accents.
 *
 * Use these semantic tokens across the app instead of hard‑coding colors
 * so that screens feel consistently branded.
 */
const primaryNavy = '#0b1030';
const primaryOrange = '#ff8a1f';
const accentGold = '#f6bd33';
const softSand = '#fff5da';
const softGrey = '#e4e6ed';
const dangerRed = '#e53935';

export const Colors = {
  light: {
    // Core
    text: '#141824',
    background: softSand,
    tint: primaryOrange,
    icon: primaryNavy,
    tabIconDefault: '#f9e3a5',
    tabIconSelected: '#ffffff',

    // Surfaces
    surface: '#ffffff',
    surfaceMuted: '#fdf0c6',
    card: '#ffb347',
    cardAlt: '#18255f',

    // Borders & subtle lines
    outline: '#f0d38b',
    divider: softGrey,

    // Feedback
    danger: dangerRed,
    success: '#2e7d32',
    warning: accentGold,

    // Brand helpers
    navy: primaryNavy,
    orange: primaryOrange,
    gold: accentGold,
  },
  dark: {
    // Core
    text: '#f5f6fb',
    background: primaryNavy,
    tint: accentGold,
    icon: '#c2c7ff',
    tabIconDefault: '#7d86b8',
    tabIconSelected: '#ffffff',

    // Surfaces
    surface: '#151a3b',
    surfaceMuted: '#1f264b',
    card: '#ff8a1f',
    cardAlt: '#26356d',

    // Borders & subtle lines
    outline: '#3b467a',
    divider: '#22284a',

    // Feedback
    danger: '#ef5350',
    success: '#66bb6a',
    warning: accentGold,

    // Brand helpers
    navy: primaryNavy,
    orange: primaryOrange,
    gold: accentGold,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
