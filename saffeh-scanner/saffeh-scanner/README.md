# Saffeh Scanner

A React Native application for security guards and parking gate operators to scan and validate QR codes from the Saffeh parking application.

## Features

- 📱 **QR Code Scanner**: High-performance camera-based QR code scanning
- ✅ **Real-time Validation**: Instant verification against the Saffeh backend
- 🎨 **Modern UI**: Clean, professional interface inspired by the Saffeh app
- 🔒 **Secure**: Token-based QR validation
- 📊 **Detailed Results**: Shows vehicle info, entry time, and fees
- ⚙️ **Configurable**: Customizable API URL, gate ID, and guard ID

## Screenshots

The app features a welcome screen with the Saffeh branding colors (deep navy blue gradient), and a scanner screen with corner markers and animated scan line.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd saffeh-scanner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on your device.

### Configuration

The app connects to the Saffeh backend API. You can configure the following settings in the Settings screen:

- **API URL**: Default is `http://localhost:4000`
- **Gate ID**: Identifier for the gate where scanning is performed
- **Guard ID**: Identifier for the security guard/operator

### Backend API

The app communicates with the Saffeh parking backend at the following endpoint:

```
POST /api/qr/validate
```

**Request Body:**
```json
{
  "qrToken": "c740a3a8e9303f9953c680341d3d88dee9ddc051bd66a89c",
  "gateId": "GATE_001",
  "guardId": "GUARD_001",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "QR Code validated successfully",
  "data": {
    "valid": true,
    "vehicleInfo": {
      "plateNumber": "ABC-1234",
      "entryTime": "2024-01-15T08:00:00.000Z",
      "parkingDuration": "2h 30m",
      "fee": 5.00
    },
    "gateAccess": {
      "allowed": true,
      "gateId": "GATE_001",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid QR code",
  "error": "TOKEN_EXPIRED"
}
```

## Project Structure

```
saffeh-scanner/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with navigation
│   ├── index.tsx           # Welcome/home screen
│   ├── scanner.tsx         # QR scanner screen
│   └── settings.tsx        # Settings screen
├── assets/
│   └── images/             # App icons and images
├── components/             # Reusable UI components
│   ├── Button.tsx
│   ├── QRScanner.tsx
│   ├── StatusCard.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
├── constants/              # App constants and configuration
│   ├── Colors.ts
│   └── Config.ts
├── hooks/                  # Custom React hooks
│   ├── useColorScheme.ts
│   └── useThemeColor.ts
├── services/               # API services
│   └── api.ts
└── utils/                  # Utility functions
```

## Color Theme

The app uses a color scheme inspired by the Saffeh application:

- **Primary**: Deep navy blue (`#1E3A5F`)
- **Secondary**: Bright blue accent (`#4A90D9`)
- **Success**: Green (`#2ECC71`)
- **Error**: Red (`#E74C3C`)
- **Background**: Light gray (`#F5F7FA`)

## Building for Production

### Android

```bash
npx expo build:android
# or
eas build --platform android
```

### iOS

```bash
npx expo build:ios
# or
eas build --platform ios
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Tech Stack

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based routing
- **Expo Camera** - QR code scanning
- **AsyncStorage** - Local settings persistence

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Related Projects

- [Saffeh Mobile App](https://github.com/rahafmassad/capstone) - Main Saffeh parking application
- [Saffeh Backend](https://github.com/Salahmutasem/saffehjo-parking-backend) - Backend API server

## Support

For support, please contact the Saffeh development team or open an issue in this repository.
