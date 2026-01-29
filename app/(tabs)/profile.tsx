import { ScreenBackground } from '@/components/screen-background';
import { Skeleton } from '@/components/skeleton-loader';
import { ApiError, getCurrentUser, updateCurrentUser } from '@/services/api';
import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await storage.getToken();
      if (!token) {
        // No token, redirect to login
        router.replace('/welcome');
        return;
      }

      const response = await getCurrentUser(token);
      const user = response.user;
      
      // Populate form fields with user data
      setName(user.fullName || '');
      setEmail(user.email || '');
      // Don't populate password field for security
      setPassword('');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        // Unauthorized, clear storage and redirect to login
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      const errorMessage = apiError.message || 'Failed to load profile. Please try again.';
      setError(errorMessage);
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleUpdate = async () => {
    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
        return;
      }

      // Prepare update data (only include fields that have changed)
      const updateData: { fullName?: string; email?: string; password?: string } = {
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
      };

      // Only include password if it's been entered
      if (password.trim()) {
        if (password.trim().length < 6) {
          setError('Password must be at least 6 characters long');
          setUpdating(false);
          return;
        }
        updateData.password = password.trim();
      }

      const response = await updateCurrentUser(updateData, token);
      
      // Update stored user data
      await storage.saveUser(response.user);
      
      // Clear password field after successful update
      setPassword('');

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await storage.clearAuth();
        router.replace('/welcome');
        return;
      }
      const errorMessage = apiError.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    // Clear stored auth data
    await storage.clearAuth();
    // Navigate to welcome page and reset navigation stack
    router.replace('/welcome');
  };

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.skeletonContainer}>
              <Skeleton width={120} height={120} borderRadius={60} style={{ alignSelf: 'center', marginBottom: 24 }} />
              <View style={styles.skeletonForm}>
                <Skeleton width="100%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={50} borderRadius={8} style={{ marginBottom: 16 }} />
                <Skeleton width="100%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={50} borderRadius={8} style={{ marginBottom: 16 }} />
                <Skeleton width="100%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={50} borderRadius={8} style={{ marginBottom: 16 }} />
                <Skeleton width="100%" height={50} borderRadius={12} style={{ marginTop: 8 }} />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.topSection}>
                {/* Page Title */}
                <Text style={styles.pageTitle}>Profile</Text>
                
                {/* Profile Image */}
                <View style={styles.profileImageContainer}>
                  <Image
                    source={require('@/assets/images/profile.jpg')}
                    style={styles.profileImage}
                    contentFit="cover"
                  />
                </View>
                
                <View style={styles.formContainer}>
                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                  {/* Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Name"
                      placeholderTextColor="#CCCCCC"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Email"
                      placeholderTextColor="#CCCCCC"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Enter Password"
                        placeholderTextColor="#CCCCCC"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor="#333333"
                        underlineColorAndroid="transparent"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.passwordToggle}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name={showPassword ? "visibility" : "visibility-off"}
                          size={24}
                          color="#666666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Update Button */}
                  <TouchableOpacity
                    style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                    onPress={handleUpdate}
                    activeOpacity={0.8}
                    disabled={updating}
                  >
                    <Text style={styles.updateButtonText}>
                      {updating ? 'UPDATING...' : 'UPDATE'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Out Button - Outside white container */}
              <View style={styles.signOutContainer}>
                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={handleSignOut}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signOutButtonText}>SIGN OUT</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'left',
    marginBottom: 0,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 0,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
  },
  topSection: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    marginBottom: 24,
    minHeight: Dimensions.get('window').height * 0.2,
    flexDirection: 'column',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingRight: 8,
  },
  passwordToggle: {
    padding: 4,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skeletonForm: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
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
  updateButton: {
    backgroundColor: '#1E3264',
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
  updateButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  signOutContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  signOutButton: {
    backgroundColor: '#f6bd33',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});

