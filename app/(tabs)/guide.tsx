import { storage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

// Styles for animated backgrounds
const animatedStyles = StyleSheet.create({
  animatedOrb: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.6,
  },
  rotatingGradient: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 1.5,
    top: -SCREEN_HEIGHT * 0.25,
    left: -SCREEN_WIDTH * 0.25,
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
  pulseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

interface GuideItem {
  number: number;
  title: string;
  text: string;
}

const guideItems: GuideItem[] = [
  {
    number: 1,
    title: 'Sign Up & Login',
    text: 'create your account with your name, email, and password, then log in.',
  },
  {
    number: 2,
    title: 'Book a Spot',
    text: 'in the home page, select a location, gate, and block to book at most 1 hour in advance.',
  },
  {
    number: 3,
    title: 'Payment & QR Code',
    text: 'pay securely by card. A QR code will be generated, use it to check in at the parking area.',
  },
  {
    number: 4,
    title: 'Check In',
    text: 'scan the QR code on arrival to consume it. Arrive within 1 hour or your reservation will be cancelled.',
  },
  {
    number: 5,
    title: 'Cancel Booking',
    text: 'cancel at least 1 hour before to get a 50% refund as a voucher of single use.',
  },
  {
    number: 6,
    title: 'Penalties & Violations',
    text: 'late arrival, which is over 1 hour, will result in auto cancellation with no refund.',
  },
];

// Animated background component for each slide
function AnimatedSlideBackground({ slideIndex }: { slideIndex: number }) {
  // Different animation values for each slide
  const orb1Opacity = useSharedValue(0.3);
  const orb2Opacity = useSharedValue(0.2);
  const orb1Scale = useSharedValue(1);
  const orb2Scale = useSharedValue(1);
  const stripeX = useSharedValue(-SCREEN_WIDTH * 2);
  const rotateValue = useSharedValue(0);
  const pulseValue = useSharedValue(0.5);

  useEffect(() => {
    // Different animations based on slide index
    switch (slideIndex) {
      case 0: // Sign Up & Login - Pulsing blue orbs
        orb1Opacity.value = withRepeat(
          withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        orb2Opacity.value = withRepeat(
          withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        break;
      case 1: // Book a Spot - Rotating yellow gradient
        rotateValue.value = withRepeat(
          withTiming(360, { duration: 15000, easing: Easing.linear }),
          -1,
          false
        );
        break;
      case 2: // Payment & QR Code - Pulsing scale
        orb1Scale.value = withRepeat(
          withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        orb2Scale.value = withRepeat(
          withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        break;
      case 3: // Check In - Moving stripes
        stripeX.value = withRepeat(
          withTiming(SCREEN_WIDTH * 2, { duration: 12000, easing: Easing.linear }),
          -1,
          true
        );
        break;
      case 4: // Cancel Booking - Pulsing opacity
        pulseValue.value = withRepeat(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        break;
      case 5: // Penalties - Slow pulsing
        orb1Opacity.value = withRepeat(
          withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        orb2Opacity.value = withRepeat(
          withTiming(0.6, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIndex]);

  const orb1Style = useAnimatedStyle(() => ({
    opacity: orb1Opacity.value,
    transform: [{ scale: orb1Scale.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    opacity: orb2Opacity.value,
    transform: [{ scale: orb2Scale.value }],
  }));

  const stripeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: stripeX.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
  }));

  // Different color schemes for each slide - dark blue primary with yellow/orange touches
  const getSlideColors = () => {
    switch (slideIndex) {
      case 0:
        return { primary: '#1E3264', secondary: '#4c61ad', accent: '#f6bd33' }; // Dark blue with yellow
      case 1:
        return { primary: '#1E3264', secondary: '#4c61ad', accent: '#f6bd33' }; // Dark blue with yellow
      case 2:
        return { primary: '#1E3264', secondary: '#4c61ad', accent: '#ffa726' }; // Dark blue with orange
      case 3:
        return { primary: '#1E3264', secondary: '#4c61ad', accent: '#f6bd33' }; // Dark blue with yellow
      case 4:
        return { primary: '#1E3264', secondary: '#4c61ad', accent: '#ffa726' }; // Dark blue with orange
      case 5:
        return { primary: '#1E3264', secondary: '#4c61ad', accent: '#f6bd33' }; // Dark blue with yellow
      default:
        return { primary: '#1E3264', secondary: '#4c61ad', accent: '#f6bd33' };
    }
  };

  const colors = getSlideColors();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base gradient - dark blue primary */}
      <LinearGradient
        colors={[colors.primary, colors.secondary, '#18255f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated elements based on slide */}
      {slideIndex === 0 && (
        <>
          <Animated.View style={[animatedStyles.animatedOrb, orb1Style, { top: -100, left: -100 }]}>
            <LinearGradient
              colors={[colors.secondary, 'transparent']}
              style={animatedStyles.orbGradient}
            />
          </Animated.View>
          <Animated.View style={[animatedStyles.animatedOrb, orb2Style, { bottom: -100, right: -100 }]}>
            <LinearGradient
              colors={[colors.accent, 'transparent']}
              style={animatedStyles.orbGradient}
            />
          </Animated.View>
        </>
      )}

      {slideIndex === 1 && (
        <Animated.View style={[animatedStyles.rotatingGradient, rotateStyle]}>
          <LinearGradient
            colors={[`rgba(246, 189, 51, 0.25)`, 'transparent', `rgba(255, 167, 38, 0.2)`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {slideIndex === 2 && (
        <>
          <Animated.View style={[animatedStyles.animatedOrb, orb1Style, { top: '20%', left: '10%' }]}>
            <LinearGradient
              colors={[colors.secondary, 'transparent']}
              style={animatedStyles.orbGradient}
            />
          </Animated.View>
          <Animated.View style={[animatedStyles.animatedOrb, orb2Style, { bottom: '20%', right: '10%' }]}>
            <LinearGradient
              colors={[colors.accent, 'transparent']}
              style={animatedStyles.orbGradient}
            />
          </Animated.View>
        </>
      )}

      {slideIndex === 3 && (
        <Animated.View style={[animatedStyles.stripeContainer, stripeStyle]}>
          <View style={animatedStyles.stripeWrapper}>
            <LinearGradient
              colors={['transparent', 'rgba(76, 97, 173, 0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[animatedStyles.stripe, { top: '30%', height: 100 }]}
            />
            <LinearGradient
              colors={['transparent', slideIndex === 3 && colors.accent === '#ffa726' ? 'rgba(255, 167, 38, 0.2)' : 'rgba(246, 189, 51, 0.2)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[animatedStyles.stripe, { top: '60%', height: 80 }]}
            />
          </View>
        </Animated.View>
      )}

      {slideIndex === 4 && (
        <Animated.View style={[animatedStyles.pulseContainer, pulseStyle]}>
          <LinearGradient
            colors={[colors.accent === '#ffa726' ? 'rgba(255, 167, 38, 0.2)' : 'rgba(246, 189, 51, 0.2)', 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {slideIndex === 5 && (
        <>
          <Animated.View style={[animatedStyles.animatedOrb, orb1Style, { top: '10%', left: '20%' }]}>
            <LinearGradient
              colors={[colors.primary, 'transparent']}
              style={animatedStyles.orbGradient}
            />
          </Animated.View>
          <Animated.View style={[animatedStyles.animatedOrb, orb2Style, { bottom: '10%', right: '20%' }]}>
            <LinearGradient
              colors={[colors.accent, 'transparent']}
              style={animatedStyles.orbGradient}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

// Component for animated background with fade transition
function FadeableBackground({ slideIndex, isActive }: { slideIndex: number; isActive: boolean }) {
  const opacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(
      isActive ? 1 : 0,
      { duration: 500, easing: Easing.out(Easing.ease) }
    );
  }, [isActive, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.fullScreenBackground,
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <AnimatedSlideBackground slideIndex={slideIndex} />
    </Animated.View>
  );
}

export default function GuideScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      if (!token) {
        router.replace('/welcome');
      }
    };
    checkAuth();
  }, []);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < guideItems.length) {
      setCurrentIndex(index);
    }
  };

  const goToSlide = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < guideItems.length - 1) {
      goToSlide(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated backgrounds for each slide - positioned absolutely behind everything */}
      {guideItems.map((item, index) => (
        <FadeableBackground
          key={`bg-${index}`}
          slideIndex={index}
          isActive={currentIndex === index}
        />
      ))}

        {/* Page Title */}
        <Text style={styles.pageTitle}>Guide</Text>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          style={styles.scrollView}
        >
          {guideItems.map((item, index) => (
            <View key={index} style={styles.slide}>
              <View style={styles.slideContent}>
                <View style={styles.titleContainer}>
                  <Text style={styles.guideNumber}>{item.number}.</Text>
                  <Text style={styles.guideTitle}>{item.title}</Text>
            </View>
                <Text style={styles.guideText}>{item.text}</Text>
          </View>
            </View>
          ))}
        </ScrollView>
          </View>

        {/* Navigation Dots */}
        <View style={styles.dotsContainer}>
          {guideItems.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
              ]}
              onPress={() => goToSlide(index)}
              activeOpacity={0.7}
            />
          ))}
          </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={currentIndex === 0 ? '#666666' : '#FFFFFF'}
            />
            <Text
              style={[
                styles.navButtonText,
                currentIndex === 0 && styles.navButtonTextDisabled,
              ]}
            >
              Previous
              </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === guideItems.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={goToNext}
            disabled={currentIndex === guideItems.length - 1}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.navButtonText,
                currentIndex === guideItems.length - 1 && styles.navButtonTextDisabled,
              ]}
            >
              Next
              </Text>
            <MaterialIcons
              name="arrow-forward"
              size={24}
              color={
                currentIndex === guideItems.length - 1 ? '#666666' : '#FFFFFF'
              }
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18255f',
  },
  fullScreenBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
    zIndex: 1,
    position: 'relative',
  },
  sliderContainer: {
    flex: 1,
    marginBottom: 20,
    zIndex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '90%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  guideNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f6bd33',
    marginRight: 8,
  },
  guideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  guideText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    zIndex: 1,
    position: 'relative',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#f6bd33',
    width: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
    position: 'relative',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3264',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(30, 50, 100, 0.5)',
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navButtonTextDisabled: {
    color: '#666666',
  },
});
