import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TermsScreen() {
  const router = useRouter();
  const [isAccepted, setIsAccepted] = useState(false);

  const handleSubmit = () => {
    if (isAccepted) {
      // Handle terms acceptance
      console.log('Terms accepted');
      // Navigate to home page
      router.replace('/(tabs)');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const toggleAcceptance = () => {
    setIsAccepted(!isAccepted);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Terms and Conditions</Text>

        {/* Terms Content */}
        <Text style={styles.termsText}>
          By using SAFFEH JO, you agree to provide accurate information and follow all booking rules. You can reserve a parking spot up to one hour in advance, pay online, and check in using a one-time QR code. Cancellations made at least one hour before the booking time get a 50% refund, while late arrivals result in cancellation. Parking in the wrong spot leads to a 3-day ban and 5 JOD fine; If someone takes your spot, you may get double the fee with valid proof. Misuse of the app or system may result in suspension, and while real-time data is used, availability may not always be guaranteed.
        </Text>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={toggleAcceptance}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, isAccepted && styles.checkboxChecked]}>
            {isAccepted && (
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>I accept the terms and conditions</Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isAccepted && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!isAccepted}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>CANCEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  termsText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'left',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    textTransform: 'uppercase',
  },
});

