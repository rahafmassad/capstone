/**
 * Saffeh Scanner Color Theme
 * Colors inspired by the Saffeh parking application
 */

export const Colors = {
  light: {
    // Primary Colors
    primary: '#1E3A5F',         // Deep navy blue - main brand color
    primaryLight: '#2E5A8F',    // Lighter navy
    primaryDark: '#0F2A4F',     // Darker navy
    
    // Secondary Colors
    secondary: '#4A90D9',       // Bright blue accent
    secondaryLight: '#6BA8E9',
    
    // Success/Error States
    success: '#2ECC71',         // Green for successful scan
    successLight: '#A8E6CF',
    error: '#E74C3C',           // Red for failed validation
    errorLight: '#FADBD8',
    warning: '#F39C12',         // Orange for warnings
    
    // Background Colors
    background: '#F5F7FA',      // Light gray background
    surface: '#FFFFFF',         // White surface
    card: '#FFFFFF',
    
    // Text Colors
    text: '#1E3A5F',            // Primary text
    textSecondary: '#6B7C93',   // Secondary text
    textLight: '#FFFFFF',       // Text on dark backgrounds
    textMuted: '#9CA3AF',
    
    // Border & Dividers
    border: '#E1E8EF',
    divider: '#E1E8EF',
    
    // Scanner specific
    scannerOverlay: 'rgba(30, 58, 95, 0.7)',
    scannerBorder: '#4A90D9',
    scannerCorner: '#2ECC71',
    
    // Icon colors
    icon: '#1E3A5F',
    iconInactive: '#9CA3AF',
    
    // Tab bar
    tabIconDefault: '#6B7C93',
    tabIconSelected: '#1E3A5F',
  },
  dark: {
    // Primary Colors
    primary: '#4A90D9',
    primaryLight: '#6BA8E9',
    primaryDark: '#2E5A8F',
    
    // Secondary Colors
    secondary: '#6BA8E9',
    secondaryLight: '#8BC4F9',
    
    // Success/Error States
    success: '#2ECC71',
    successLight: '#27AE60',
    error: '#E74C3C',
    errorLight: '#C0392B',
    warning: '#F39C12',
    
    // Background Colors
    background: '#0F1419',
    surface: '#1A2332',
    card: '#1A2332',
    
    // Text Colors
    text: '#F5F7FA',
    textSecondary: '#9CA3AF',
    textLight: '#FFFFFF',
    textMuted: '#6B7C93',
    
    // Border & Dividers
    border: '#2E3A4D',
    divider: '#2E3A4D',
    
    // Scanner specific
    scannerOverlay: 'rgba(15, 20, 25, 0.8)',
    scannerBorder: '#4A90D9',
    scannerCorner: '#2ECC71',
    
    // Icon colors
    icon: '#F5F7FA',
    iconInactive: '#6B7C93',
    
    // Tab bar
    tabIconDefault: '#6B7C93',
    tabIconSelected: '#4A90D9',
  },
};

export type ColorScheme = keyof typeof Colors;
