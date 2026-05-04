import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background with gradient effect */}
      <View style={styles.gradient}>
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={80} color="#fff" />
            </View>
            <View style={styles.sparkle1}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <View style={styles.sparkle2}>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>Eduflow</Text>
          <Text style={styles.tagline}>Learn. Grow. Succeed.</Text>

          {/* Features */}
          <View style={styles.featuresBox}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#43C678" />
              <Text style={styles.featureText}>O/L Exam Preparation</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#43C678" />
              <Text style={styles.featureText}>Video Lessons & Quizzes</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#43C678" />
              <Text style={styles.featureText}>Track Your Progress</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#43C678" />
              <Text style={styles.featureText}>100% Free Forever</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1000+</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100+</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
          </View>

          {/* CTA Buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('Onboarding')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={24} color="#667eea" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.replace('Auth')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for Sri Lankan Students
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#667eea',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    top: height * 0.3,
    left: -30,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 10,
    left: -10,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    fontWeight: '500',
  },
  featuresBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 16,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});

export default LandingScreen;
