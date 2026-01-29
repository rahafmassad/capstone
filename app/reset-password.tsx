import { ApiError, forgotPassword } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Background animation values
  const orb1Opacity = useSharedValue(0.3);
  const orb2Opacity = useSharedValue(0.2);
  const stripeX = useSharedValue(-SCREEN_WIDTH * 2);

  useEffect(() => {
    // Initialize and start orb 1 opacity animation - infinite loop with reverse
    orb1Opacity.value = 0.3;
    orb1Opacity.value = withRepeat(
      withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Initialize and start orb 2 opacity animation - infinite loop with reverse
    orb2Opacity.value = 0.2;
    orb2Opacity.value = withRepeat(
      withTiming(0.4, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Initialize and start stripe animation - smooth infinite loop with reverse
    stripeX.value = -SCREEN_WIDTH * 2;
    stripeX.value = withRepeat(
      withTiming(SCREEN_WIDTH * 2, { duration: 20000, easing: Easing.linear }),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated styles for background elements
  const orb1Style = useAnimatedStyle(() => ({
    opacity: orb1Opacity.value,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    opacity: orb2Opacity.value,
  }));

  const stripeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: stripeX.value }],
  }));

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    // Validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await forgotPassword({
        email: email.trim().toLowerCase(),
      });

      setSuccess(true);
      Alert.alert(
        'Password Reset Requested',
        'If this email exists in our system, a password reset link has been sent. Please check your email.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Background base */}
        <View style={styles.backgroundBase} />

        {/* Animated gradient orb 1 */}
        <Animated.View style={[styles.orbContainer, orb1Style]} pointerEvents="none">
          <LinearGradient
            colors={['#4c61ad', 'transparent']}
            start={{ x: 0.2, y: 0.3 }}
            end={{ x: 0.2, y: 0.8 }}
            style={styles.orb}
          />
        </Animated.View>

        {/* Animated gradient orb 2 */}
        <Animated.View style={[styles.orbContainer2, orb2Style]} pointerEvents="none">
          <LinearGradient
            colors={['#f6bd33', 'transparent']}
            start={{ x: 0.8, y: 0.7 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.orb}
          />
        </Animated.View>

        {/* Diagonal animated stripes */}
        <Animated.View style={[styles.stripeContainer, stripeStyle]} pointerEvents="none">
          <View style={styles.stripeWrapper}>
            <LinearGradient
              colors={['transparent', 'rgba(76, 97, 173, 0.2)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.stripe, { top: '25%', height: 128 }]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(246, 189, 51, 0.15)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.stripe, { top: '50%', height: 96 }]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(76, 97, 173, 0.25)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.stripe, { top: '75%', height: 160 }]}
            />
          </View>
        </Animated.View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Reset Password Card */}
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>Reset Password</Text>

            {/* Description */}
            <Text style={styles.description}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Success Message */}
            {success && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Reset instructions sent to your email.
                </Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Enter email..."
                placeholderTextColor="#CCCCCC"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                  setSuccess(false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'SENDING...' : 'SEND RESET LINK'}
              </Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#1E3264" />
              <Text style={styles.backButtonText}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18255f',
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  backgroundBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#18255f',
  },
  orbContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 1.5,
    transform: [{ translateX: -SCREEN_WIDTH * 0.3 }, { translateY: -SCREEN_HEIGHT * 0.2 }],
  },
  orbContainer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 1.5,
    transform: [{ translateX: SCREEN_WIDTH * 0.3 }, { translateY: SCREEN_HEIGHT * 0.2 }],
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.75,
  },
  stripeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT,
  },
  stripeWrapper: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '12deg' }],
  },
  stripe: {
    position: 'absolute',
    left: '-50%',
    width: '200%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    zIndex: 1,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3264',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3264',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
  },
  inputError: {
    borderColor: '#F44336',
  },
  submitButton: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});


