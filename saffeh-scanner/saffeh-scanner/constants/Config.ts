/**
 * Application Configuration
 */

export const Config = {
  // API Configuration
  API_BASE_URL: 'http://localhost:4000',
  API_ENDPOINTS: {
    QR_VALIDATE: '/api/qr/validate',
  },
  
  // Scanner Configuration
  SCANNER: {
    SCAN_INTERVAL: 2000,        // Minimum time between scans (ms)
    VIBRATION_DURATION: 100,    // Haptic feedback duration (ms)
    SUCCESS_DISPLAY_TIME: 3000, // Time to show success message (ms)
    ERROR_DISPLAY_TIME: 4000,   // Time to show error message (ms)
  },
  
  // App Information
  APP: {
    NAME: 'Saffeh Scanner',
    VERSION: '1.0.0',
    DESCRIPTION: 'Security & Parking Gate QR Code Scanner',
  },
};

export default Config;
