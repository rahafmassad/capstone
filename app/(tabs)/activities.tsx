import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
type SortOption = 'all' | 'newest' | 'oldest';

export default function ActivitiesScreen() {
  const [selectedSort, setSelectedSort] = useState<SortOption>('all');

  // Sample activities data
  const activities = [
    { id: 1, name: 'Activity name', dateTime: 'Activity date and time' },
    { id: 2, name: 'Activity name', dateTime: 'Activity date and time' },
    { id: 3, name: 'Activity name', dateTime: 'Activity date and time' },
  ];

  const handleSortChange = (sort: SortOption) => {
    setSelectedSort(sort);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Activities</Text>
        
        {/* Sorting Buttons */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              selectedSort === 'all' && styles.sortButtonSelected,
            ]}
            onPress={() => handleSortChange('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortButtonText,
                selectedSort === 'all' && styles.sortButtonTextSelected,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              selectedSort === 'newest' && styles.sortButtonSelected,
            ]}
            onPress={() => handleSortChange('newest')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortButtonText,
                selectedSort === 'newest' && styles.sortButtonTextSelected,
              ]}
            >
              Newest to oldest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              selectedSort === 'oldest' && styles.sortButtonSelected,
            ]}
            onPress={() => handleSortChange('oldest')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortButtonText,
                selectedSort === 'oldest' && styles.sortButtonTextSelected,
              ]}
            >
              Oldest to newest
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activities Heading */}
        <Text style={styles.activitiesHeading}>Activities</Text>

        {/* Activities List */}
        <View style={styles.activitiesList}>
          {activities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                {/* Circular placeholder */}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityName}>{activity.name}</Text>
                <Text style={styles.activityDateTime}>{activity.dateTime}</Text>
              </View>
            </View>
          ))}
        </View>
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
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  sortContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  sortButton: {
    flex: 1,
    backgroundColor: '#f6bd33',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonSelected: {
    backgroundColor: '#1E3264',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  sortButtonTextSelected: {
    color: '#FFFFFF',
  },
  activitiesHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  activitiesList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  activityDateTime: {
    fontSize: 14,
    color: '#666666',
  },
});

