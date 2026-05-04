import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Eduflow! 🎓',
    description: 'Your complete O/L exam preparation platform. Learn from grades 6-11 with expert teachers - 100% FREE!',
    icon: 'school',
    color: '#6C63FF',
    gradient: ['#667eea', '#764ba2'],
    emoji: '🎓'
  },
  {
    id: '2',
    title: 'Learn Anytime, Anywhere 📚',
    description: 'Watch video lessons, take quizzes, submit assignments, and join live classes - all from your phone!',
    icon: 'book',
    color: '#FF6584',
    gradient: ['#f093fb', '#f5576c'],
    emoji: '📚'
  },
  {
    id: '3',
    title: 'Track Your Progress 📊',
    description: 'Monitor your learning with detailed analytics, earn badges, climb the leaderboard, and get certificates!',
    icon: 'stats-chart',
    color: '#43C678',
    gradient: ['#4facfe', '#00f2fe'],
    emoji: '📊'
  },
  {
    id: '4',
    title: 'Join Discussions 💬',
    description: 'Ask questions, help others, and learn together with your peers in our active community!',
    icon: 'chatbubbles',
    color: '#FFB347',
    gradient: ['#fa709a', '#fee140'],
    emoji: '💬'
  },
  {
    id: '5',
    title: 'Gamified Learning 🎮',
    description: 'Earn points, unlock achievements, maintain streaks, and compete with friends while learning!',
    icon: 'trophy',
    color: '#9C88FF',
    gradient: ['#a8edea', '#fed6e3'],
    emoji: '🎮'
  }
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleSkip = async () => {
    await handleDone();
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.slide}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={100} color={item.color} />
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {/* Feature highlights */}
      {index === 0 && (
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#43C678" />
            <Text style={styles.featureText}>100% Free</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#43C678" />
            <Text style={styles.featureText}>O/L Focused</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#43C678" />
            <Text style={styles.featureText}>Expert Teachers</Text>
          </View>
        </View>
      )}
    </View>
  );

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: slides[currentIndex].color,
                },
              ]}
              key={i.toString()}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Paginator />
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: slides[currentIndex].color }
          ]}
          onPress={scrollTo}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  emojiContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emoji: {
    fontSize: 28,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  paginatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});

export default OnboardingScreen;
