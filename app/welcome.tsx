import { ApiError, login, signup } from '@/services/api';
import { storage } from '@/utils/storage';
import { Image } from 'expo-image';
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

type FormType = 'none' | 'signup' | 'login';

export default function WelcomeScreen() {
  const router = useRouter();
  const [formType, setFormType] = useState<FormType>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      if (token) {
        // User is already logged in, redirect to home
        router.replace('/(tabs)');
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background animation values
  const orb1Opacity = useSharedValue(0.3);
  const orb2Opacity = useSharedValue(0.2);
  const stripeX = useSharedValue(-SCREEN_WIDTH * 2);

  // Form animation values
  const logoY = useSharedValue(0);
  const buttonsX = useSharedValue(0);
  const signupFormX = useSharedValue(SCREEN_WIDTH);
  const loginFormX = useSharedValue(-SCREEN_WIDTH);
  
  // Button press animation values
  const signupButtonY = useSharedValue(0);
  const loginButtonY = useSharedValue(0);

  useEffect(() => {
    // Animate orb 1 opacity
    orb1Opacity.value = withRepeat(
      withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Animate orb 2 opacity with delay
    orb2Opacity.value = withRepeat(
      withTiming(0.4, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Animate stripes
    stripeX.value = withRepeat(
      withTiming(SCREEN_WIDTH * 2, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formType === 'signup') {
      // Logo moves up to top of form
      logoY.value = withTiming(-260, { duration: 400, easing: Easing.out(Easing.ease) });
      // Buttons slide left
      buttonsX.value = withTiming(-SCREEN_WIDTH, { duration: 400, easing: Easing.in(Easing.ease) });
      // Signup form slides in from right
      signupFormX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
    } else if (formType === 'login') {
      // Logo moves up to top of form
      logoY.value = withTiming(-230, { duration: 400, easing: Easing.out(Easing.ease) });
      // Buttons slide right
      buttonsX.value = withTiming(SCREEN_WIDTH, { duration: 400, easing: Easing.in(Easing.ease) });
      // Login form slides in from left
      loginFormX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
    } else {
      // Reset animations
      logoY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
      buttonsX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
      signupFormX.value = withTiming(SCREEN_WIDTH, { duration: 400, easing: Easing.in(Easing.ease) });
      loginFormX.value = withTiming(-SCREEN_WIDTH, { duration: 400, easing: Easing.in(Easing.ease) });
    }
  }, [formType, logoY, buttonsX, signupFormX, loginFormX]);

  // Animated styles
  const orb1Style = useAnimatedStyle(() => ({
    opacity: orb1Opacity.value,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    opacity: orb2Opacity.value,
  }));

  const stripeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: stripeX.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoY.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: buttonsX.value }],
  }));

  const signupButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: signupButtonY.value }],
  }));

  const loginButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: loginButtonY.value }],
  }));

  const signupFormStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: signupFormX.value }],
  }));

  const loginFormStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loginFormX.value }],
  }));

  const handleSignUp = () => {
    setFormType('signup');
    setError(null);
  };

  const handleLogIn = () => {
    setFormType('login');
    setError(null);
  };

  const handleBack = () => {
    setFormType('none');
    setError(null);
  };

  const handleSignUpSubmit = async () => {
    // Validation
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the terms and conditions to sign up');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        acceptedTerms: acceptedTerms,
      });

      // Save token and user data
      await storage.saveToken(response.token);
      await storage.saveUser(response.user);

      // Navigate to main app (you can change this to your desired route)
      router.replace('/(tabs)');
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'An error occurred during signup. Please try again.';
      setError(errorMessage);
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password: password,
      });

      // Save token and user data
      await storage.saveToken(response.token);
      await storage.saveUser(response.user);

      // Navigate to main app (you can change this to your desired route)
      router.replace('/(tabs)');
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Invalid email or password. Please try again.';
      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/reset-password');
  };

  const handlePrivacyPolicy = () => {
    console.log('Privacy Policy pressed');
  };

  const handleTermsOfService = () => {
    router.push('/terms');
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
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <Image
              source={require('@/assets/images/saffeh-logo-2.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonContainer, buttonsStyle]}>
            <Animated.View style={signupButtonStyle}>
              <TouchableOpacity
                style={[styles.button, styles.signUpButton]}
                onPress={handleSignUp}
                onPressIn={() => {
                  signupButtonY.value = withTiming(-2, { duration: 100 });
                }}
                onPressOut={() => {
                  signupButtonY.value = withTiming(0, { duration: 100 });
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.signUpButtonText]}>SIGN UP</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={loginButtonStyle}>
              <TouchableOpacity
                style={[styles.button, styles.logInButton]}
                onPress={handleLogIn}
                onPressIn={() => {
                  loginButtonY.value = withTiming(-2, { duration: 100 });
                }}
                onPressOut={() => {
                  loginButtonY.value = withTiming(0, { duration: 100 });
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.logInButtonText]}>LOG IN</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Sign Up Form */}
          <Animated.View style={[styles.formWrapper, signupFormStyle]} pointerEvents={formType === 'signup' ? 'auto' : 'none'}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.card}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Sign Up</Text>

                {error && formType === 'signup' && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email..."
                    placeholderTextColor="#CCCCCC"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password..."
                    placeholderTextColor="#CCCCCC"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name..."
                    placeholderTextColor="#CCCCCC"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkboxBox, acceptedTerms && styles.checkboxBoxChecked]}>
                      {acceptedTerms && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I accept the{' '}
                      <Text style={styles.checkboxLink} onPress={handleTermsOfService}>
                        Terms and Conditions
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSignUpSubmit}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'SIGNING UP...' : 'SIGN UP'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    ALREADY HAVE AN ACCOUNT?{' '}
                    <Text style={styles.switchLink} onPress={handleLogIn}>
                      LOGIN
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          {/* Login Form */}
          <Animated.View style={[styles.formWrapper, loginFormStyle]} pointerEvents={formType === 'login' ? 'auto' : 'none'}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.card}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.loginTitle}>Log In</Text>

                {error && formType === 'login' && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email..."
                    placeholderTextColor="#CCCCCC"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password..."
                    placeholderTextColor="#CCCCCC"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginSubmitButton, loading && styles.loginSubmitButtonDisabled]}
                  onPress={handleLoginSubmit}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.loginSubmitButtonText}>
                    {loading ? 'LOGGING IN...' : 'LOG IN'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    DON&apos;T HAVE AN ACCOUNT?{' '}
                    <Text style={styles.switchLink} onPress={handleSignUp}>
                      SIGNUP
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Your Company Name. All rights reserved.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink} onPress={handlePrivacyPolicy}>
              Privacy Policy
            </Text>
            <Text style={styles.footerSeparator}> | </Text>
            <Text style={styles.footerLink} onPress={handleTermsOfService}>
              Terms of Service
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 350,
    height: 140,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 250,
    gap: 20,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButton: {
    backgroundColor: '#F5BE32',
  },
  logInButton: {
    backgroundColor: '#1E3264',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  signUpButtonText: {
    color: '#1E3264',
  },
  logInButtonText: {
    color: '#F5BE32',
  },
  formWrapper: {
    position: 'absolute',
    width: '100%',
    maxWidth: 400,
    height: '100%',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 0,
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
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1E3264',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3264',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'sans-serif',
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
  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F5BE32',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'sans-serif',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#333333',
  },
  submitButton: {
    backgroundColor: '#1E3264',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
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
  loginSubmitButton: {
    backgroundColor: '#F5BE32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginSubmitButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  loginSubmitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3264',
    textTransform: 'uppercase',
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#1E3264',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: '#1E3264',
    borderColor: '#1E3264',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  checkboxLink: {
    color: '#1E3264',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  switchContainer: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#333333',
  },
  switchLink: {
    fontWeight: 'bold',
    color: '#1E3264',
  },
  footer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#f6bd33',
    textDecorationLine: 'underline',
    fontFamily: 'sans-serif',
  },
  footerSeparator: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
  },
});
