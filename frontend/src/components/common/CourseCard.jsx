import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCoursePrice } from '../../utils/priceFormatter';

const PRIMARY = '#6C63FF';

// ── Star rating row ──────────────────────────────────────────────────────────
const Stars = ({ rating = 0, count = 0 }) => {
  if (!rating || rating === 0) {
    return (
      <View style={styles.newBadge}>
        <Text style={styles.newBadgeText}>New</Text>
      </View>
    );
  }
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={11}
          color="#FFB800"
          style={{ marginRight: 1 }}
        />
      ))}
      <Text style={styles.ratingText}> {rating.toFixed(1)} · {count} students</Text>
    </View>
  );
};

// ── Thumbnail with fallback ──────────────────────────────────────────────────
const Thumb = ({ uri, style }) =>
  uri ? (
    <Image source={{ uri }} style={style} resizeMode="cover" />
  ) : (
    <View style={[style, styles.thumbPlaceholder]}>
      <Ionicons name="book" size={28} color="#fff" />
    </View>
  );

// ── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ pct = 0 }) => (
  <View style={styles.progressBg}>
    <View style={[styles.progressFill, { width: `${pct}%` }]} />
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────
/**
 * Props:
 *  course      – course object
 *  onPress     – tap handler
 *  showProgress – show progress bar (for enrolled courses)
 *  progress    – 0-100 number
 *  enrolledAt  – date string
 */
const CourseCard = ({ course = {}, onPress, showProgress = false, progress = 0, enrolledAt }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    {/* Thumbnail */}
    <Thumb uri={course.thumbnail} style={styles.thumb} />

    {/* Content */}
    <View style={styles.right}>
      <Text style={styles.title} numberOfLines={2}>{course.title || 'Course'}</Text>

      {course.instructorId?.name && (
        <Text style={styles.instructor} numberOfLines={1}>
          {course.instructorId.name}
        </Text>
      )}

      {showProgress ? (
        <>
          <ProgressBar pct={progress} />
          <Text style={styles.progressText}>
            {progress}%{enrolledAt ? ` · ${new Date(enrolledAt).toLocaleDateString()}` : ''}
          </Text>
        </>
      ) : (
        <Stars rating={course.averageRating} count={course.totalStudents} />
      )}

      <View style={styles.bottom}>
        {course.category && (
          <View style={styles.catPill}>
            <Text style={styles.catText} numberOfLines={1}>{course.category}</Text>
          </View>
        )}
        <Text style={styles.price}>
          {formatCoursePrice(course)}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    minHeight: 100,
  },
  thumb: {
    width: 90,
    minHeight: 100,
    backgroundColor: '#E8E8F0',
  },
  thumbPlaceholder: {
    backgroundColor: '#6C63FFCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  right: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    lineHeight: 19,
    marginBottom: 3,
  },
  instructor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    color: '#888',
  },
  newBadge: {
    backgroundColor: '#43C67820',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#43C678',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catPill: {
    backgroundColor: PRIMARY + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: '65%',
  },
  catText: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PRIMARY,
  },
});

export default CourseCard;
