import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);

  const handleSearchPress = () => {
    // Handle search press (to be implemented)
    console.log('Search pressed');
  };

  const handleQRCodePress = () => {
    setIsQRModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsQRModalVisible(false);
  };

  const handlePlacePress = (placeName: string) => {
    // Handle place card press (to be implemented)
    console.log('Place pressed:', placeName);
  };

  // Sample places data
  const places = [
    { id: 1, name: 'Place name', workingTime: 'Place working time' },
    { id: 2, name: 'Place name', workingTime: 'Place working time' },
    { id: 3, name: 'Place name', workingTime: 'Place working time' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/saffeh-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.8}
        >
          <MaterialIcons name="search" size={24} color="#666666" />
          <Text style={styles.searchText}>Search for locations</Text>
        </TouchableOpacity>

        {/* QR Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The QR code</Text>
          <TouchableOpacity
            style={styles.qrCodeContainer}
            onPress={handleQRCodePress}
            activeOpacity={0.8}
          >
            <Image
              source={require('@/assets/images/qr-code.png')}
              style={styles.qrCodeImage}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Places Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          <View style={styles.placesGrid}>
            {places.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => handlePlacePress(place.name)}
                activeOpacity={0.8}
              >
                <View style={styles.placeImage}>
                  <MaterialIcons name="landscape" size={40} color="#999999" />
                </View>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeTime}>{place.workingTime}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={isQRModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>The QR code</Text>
            <Text style={styles.modalDescription}>
              Scan your QR code and this QR code will become unusable again after scanning
            </Text>
            <View style={styles.modalQRContainer}>
              <Image
                source={require('@/assets/images/qr-code.png')}
                style={styles.modalQRImage}
                contentFit="contain"
              />
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCloseModal}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 85,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchText: {
    fontSize: 16,
    color: '#999999',
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 15,
  },
  qrCodeContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  qrCodeImage: {
    width: 250,
    height: 250,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  placeCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  placeImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  placeTime: {
    fontSize: 12,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalQRContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalQRImage: {
    width: 250,
    height: 250,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
});
