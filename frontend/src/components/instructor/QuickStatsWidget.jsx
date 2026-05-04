import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#6C63FF';

const StatItem = ({ icon, value, label, color, trend, onPress }) => (
  <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.statContent}>
      <View style={styles.statRow}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? '#43C67820' : '#EF444420' }]}>
            <Ionicons 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend > 0 ? '#43C678' : '#EF4444'} 
            />
            <Text style={[styles.trendText, { color: trend > 0 ? '#43C678' : '#EF4444' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const QuickStatsWidget = ({ stats, onStatPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Stats</Text>
        <Text style={styles.subtitle}>Last 7 days</Text>
      </View>
      
      <View style={styles.grid}>
        <StatItem
          icon="people"
          value={stats?.newStudents || 0}
          label="New Students"
          color="#43C678"
          trend={stats?.studentsTrend}
          onPress={() => onStatPress?.('students')}
        />
        <StatItem
          icon="document-text"
          value={stats?.newSubmissions || 0}
          label="Submissions"
          color="#3B82F6"
          trend={stats?.submissionsTrend}
          onPress={() => onStatPress?.('submissions')}
        />
        <StatItem
          icon="chatbubble"
          value={stats?.newQuestions || 0}
          label="Questions"
          color="#FFB347"
          trend={stats?.questionsTrend}
          onPress={() => onStatPress?.('questions')}
        />
        <StatItem
          icon="star"
          value={stats?.avgRating || '0.0'}
          label="Avg Rating"
          color="#FF6584"
          onPress={() => onStatPress?.('rating')}
        />
      </View>

      {stats?.alerts && stats.alerts.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={styles.alertsTitle}>⚠️ Needs Attention</Text>
          {stats.alerts.map((alert, index) => (
            <TouchableOpacity key={index} style={styles.alertItem} onPress={alert.onPress}>
              <View style={[styles.alertDot, { backgroundColor: alert.color || '#EF4444' }]} />
              <Text style={styles.alertText}>{alert.text}</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: { marginBottom: 16 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#1a1a2e' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    margin: '1%',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statContent: { flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  trendText: { fontSize: 10, fontWeight: '600', marginLeft: 2 },
  statLabel: { fontSize: 11, color: '#888' },
  alertsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  alertsTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  alertText: { flex: 1, fontSize: 13, color: '#555' },
});

export default QuickStatsWidget;
