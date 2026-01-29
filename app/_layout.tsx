import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Text } from 'react-native';

/**
 * Root layout where we enforce a consistent font family for all text,
 * so the app typography feels cohesive and close to the logo styling.
 */
function useGlobalFont() {
  useEffect(() => {
    const fontFamily =
      Platform.OS === 'ios'
        ? 'System'
        : Platform.OS === 'android'
        ? 'sans-serif'
        : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    // Use type assertion to access defaultProps which exists at runtime
    const TextComponent = Text as any;
    if (!TextComponent.defaultProps) {
      TextComponent.defaultProps = {};
    }

    if (!TextComponent.defaultProps.style) {
      TextComponent.defaultProps.style = {};
    }

    TextComponent.defaultProps.style.fontFamily = fontFamily;
  }, []);
}

export default function RootLayout() {
  useGlobalFont();

  return <Stack screenOptions={{ headerShown: false }} />;
}

