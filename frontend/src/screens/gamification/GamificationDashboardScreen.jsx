import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';
import api from '../../services/api';

const GamificationDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [gamification, setGamification] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [gamificationRes, challengesRes] = await Promise.all([
        api.get('/gamification/me'),
        api.get('/gamification/daily-challenges')
      ]);

      setGamification(gamificationRes.data.data);
      setChallenges(challengesRes.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gamification data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchGamificationData} />;
  }

  const progressPercentage = gamification 
    ? (gamification.currentLevelPoints / gamification.pointsToNextLevel) * 100
    : 0;

  const getRankColor = (rank) => {
    const colors = {
      'Beginner': '#9E9E9E',
      'Learner': '#2196F3',
      'Scholar': '#9C27B0',
      'Expert': '#FF9800',
      'Master': '#F44336',
      'Legend': '#FFD700'
    };
    return colors[rank] || '#6C63FF';
  };

  const getRankIcon = (rank) => {
    const icons = {
      'Beginner': 'leaf-outline',
      'Learner': 'book-outline',
      'Scholar': 'school-outline',
      'Expert': 'star-outline',
      'Master': 'trophy-outline',
      'Legend': 'flame-outline'
    };
    return icons[rank] || 'medal-outline';
  };

  const getWeeklyActivity = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekActivity = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if this day had activity from activityHistory
      const dayActivity = gamification?.activityHistory?.find(a => {
        const activityDate = new Date(a.date);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.toISOString().split('T')[0] === dateStr;
      });

      const isActive = dayActivity && dayActivity.activities > 0;
      const isToday = date.toDateString() === today.toDateString();

      weekActivity.push({
        label: days[dayIndex],
        isActive: isActive,
        isToday: isToday,
        activityCount: dayActivity?.activities || 0,
        date: date
      });
    }

    return weekActivity;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchGamificationData(true)}
          colors={[colors.primary]}
        />
      }
    >
      {/* Level Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={[styles.rankBadge, { backgroundColor: getRankColor(gamification.rank) + '20' }]}>
            <Ionicons 
              name={getRankIcon(gamification.rank)} 
              size={32} 
              color={getRankColor(gamification.rank)} 
            />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.rankText}>{gamification.rank}</Text>
            <Text style={styles.levelText}>Level {gamification.level}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.pointsText}>{gamification.totalPoints}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {gamification.currentLevelPoints} / {gamification.pointsToNextLevel} XP to Level {gamification.level + 1}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="school-outline" size={24} color="#6C63FF" />
          <Text style={styles.statValue}>{gamification.stats.lessonsCompleted}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#43C678" />
          <Text style={styles.statValue}>{gamification.stats.quizzesCompleted}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{gamification.stats.assignmentsSubmitted}</Text>
          <Text style={styles.statLabel}>Assignments</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="ribbon-outline" size={24} color="#F44336" />
          <Text style={styles.statValue}>{gamification.badges.length}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Weekly Activity Tracker */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FF6584" />
            <Text style={styles.streakText}>{gamification.stats.daysActive} days</Text>
          </View>
        </View>
        
        <View style={styles.weeklyActivityContainer}>
          {getWeeklyActivity().map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <View style={[
                styles.dayBox,
                day.isActive && styles.dayBoxActive,
                day.isToday && styles.dayBoxToday
              ]}>
                {day.isActive ? (
                  <Text style={styles.activityCount}>{day.activityCount}</Text>
                ) : null}
              </View>
              <Text style={styles.dayLabel}>{day.label}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.activityHint}>
          Complete lessons, quizzes, or assignments to mark the day as active
        </Text>
      </View>

      {/* Daily Challenges */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Challenges</Text>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        </View>

        {challenges.map((challenge, index) => (
          <View key={index} style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <View style={styles.challengeIcon}>
                <Ionicons 
                  name={challenge.completed ? "checkmark-circle" : "radio-button-off"} 
                  size={24} 
                  color={challenge.completed ? "#43C678" : colors.textSecondary} 
                />
              </View>
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeName}>{challenge.name}</Text>
                <Text style={styles.challengeDesc}>{challenge.description}</Text>
              </View>
              <View style={styles.challengePoints}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.challengePointsText}>{challenge.points}</Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.challengeProgress}>
              <View style={styles.challengeProgressBar}>
                <View 
                  style={[
                    styles.challengeProgressFill, 
                    { width: `${(challenge.progress / challenge.target) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.challengeProgressText}>
                {challenge.progress}/{challenge.target}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Badges */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Badges</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GamificationBadges')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {gamification.badges.slice(0, 5).map((badge, index) => (
            <View key={index} style={styles.badgeCard}>
              <View style={styles.badgeIcon}>
                <Ionicons name={badge.icon} size={32} color="#FFD700" />
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
            </View>
          ))}
          {gamification.badges.length === 0 && (
            <Text style={styles.emptyText}>No badges earned yet. Keep learning!</Text>
          )}
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('GamificationLeaderboard')}
        >
          <Ionicons name="trophy-outline" size={24} color={colors.white} />
          <Text style={styles.actionButtonText}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('GamificationBadges')}
        >
          <Ionicons name="ribbon-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>All Badges</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  levelCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rankBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  levelText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 6,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: '1%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF658420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF6584',
    marginLeft: 4,
  },
  weeklyActivityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayBoxActive: {
    backgroundColor: '#43C678',
  },
  dayBoxToday: {
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activityCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  activityHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  challengeCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIcon: {
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  challengeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  challengePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengePointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#43C678',
    borderRadius: 4,
  },
  challengeProgressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badgeCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 16,
  },
  badgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD70020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
});

export default GamificationDashboardScreen;
