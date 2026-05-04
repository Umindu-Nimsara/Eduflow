import React, { useState, useEffect, useContext } from 'react';
import { formatCoursePrice } from '../../utils/priceFormatter';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courseService } from '../../services/courseService';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

// ── Star row ──────────────────────────────────────────────────────────────────
const StarRow = ({ rating = 0, count = 0 }) => {
  if (!rating || rating === 0) {
    return <Text style={styles.noReviews}>No reviews yet</Text>;
  }
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color="#FFB800"
          style={{ marginRight: 2 }}
        />
      ))}
      <Text style={styles.ratingText}> {rating.toFixed(1)} ({count} reviews)</Text>
    </View>
  );
};

// ── Progress bar (animated) ───────────────────────────────────────────────────
const ProgressBar = ({ pct = 0, completedLessons = 0, totalLessons = 0 }) => {
  const anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {completedLessons}/{totalLessons} lessons done
        </Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeText}>{pct}%</Text>
        </View>
      </View>
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, { width }]} />
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const CourseDetailScreen = ({ route, navigation }) => {
  const { courseId, isEnrolled = false } = route.params;
  const { user } = useContext(AuthContext);

  const [course,           setCourse]           = useState(null);
  const [lessons,          setLessons]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [enrolling,        setEnrolling]        = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(isEnrolled);
  const [courseProgress,   setCourseProgress]   = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);

  useEffect(() => {
    fetchCourseDetails();
    
    // Always check enrollment and progress status
    checkEnrollmentAndProgress();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCourseDetails();
      checkEnrollmentAndProgress();
    });
    
    return unsubscribe;
  }, [courseId, navigation]);

  // ── Fetch course + lessons ────────────────────────────────────────────────
  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const [courseRes, lessonsRes] = await Promise.all([
        courseService.getCourseById(courseId),
        courseService.getLessonsByCourse(courseId),
      ]);
      setCourse(courseRes.data);
      setLessons(lessonsRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  // ── Check enrollment + progress ───────────────────────────────────────────
  const checkEnrollmentAndProgress = async () => {
    try {
      const res = await api.get(`${ENDPOINTS.ENROLLMENTS}/my-enrollments`);
      const enrollments = res.data.data || [];
      const found = enrollments.find(
        e => (e.course?._id || e.courseId) === courseId
      );
      
      if (found) {
        setEnrollmentStatus(true);
        const pct = found.progress || found.completionPercentage || 0;
        setCourseProgress(pct);
        
        // Calculate completed lessons from progress data
        if (user) {
          await fetchDetailedProgress();
        }
      }
    } catch (err) {
      console.error('Enrollment check error:', err);
    }
  };

  // ── Fetch detailed progress to get completed lesson count ─────────────────
  const fetchDetailedProgress = async () => {
    try {
      const response = await api.get(`${ENDPOINTS.PROGRESS}/${user.id}/${courseId}`);
      const progressData = response.data.data || [];
      const completed = progressData.filter(p => p.completed).length;
      setCompletedLessons(completed);
    } catch (err) {
      console.log('Detailed progress fetch error:', err);
    }
  };

  // ── Enroll ────────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await api.post(`${ENDPOINTS.ENROLLMENTS}/enroll`, { courseId });
      setEnrollmentStatus(true);
      Alert.alert('🎉 Enrolled!', `You've successfully enrolled in "${course?.title}"`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  // ── Lesson press ──────────────────────────────────────────────────────────
  const handleLessonPress = (lesson) => {
    if (enrollmentStatus) {
      navigation.navigate('Lesson', { 
        lessonId: lesson._id, 
        courseId: courseId 
      });
    } else {
      Alert.alert(
        'Enrollment Required',
        'Enroll in this course to access lessons.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enroll Now', onPress: handleEnroll },
        ]
      );
    }
  };

  if (loading) return <LoadingSpinner text="Loading course..." />;
  if (error)   return <ErrorView message={error} onRetry={fetchCourseDetails} />;
  if (!course) return <ErrorView message="Course not found" />;

  const instructor = course.instructorId || {};
  const totalHours = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const hoursText  = totalHours > 0 ? `${Math.ceil(totalHours / 60)}h` : '';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Thumbnail ── */}
        <View style={styles.thumbContainer}>
          {course.thumbnail ? (
            <Image
              source={{ uri: course.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
              <Ionicons name="book" size={64} color="#fff" />
            </View>
          )}
          {/* Dark gradient overlay */}
          <View style={styles.thumbOverlay} />
        </View>

        <View style={styles.content}>

          {/* ── Title + badges ── */}
          <View style={styles.titleRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{course.category}</Text>
            </View>
            {enrollmentStatus && (
              <View style={styles.enrolledBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#43C678" />
                <Text style={styles.enrolledText}>Enrolled</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{course.title}</Text>

          {/* ── Instructor ── */}
          {instructor.name && (
            <View style={styles.instructorRow}>
              <View style={styles.instructorAvatar}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.instructorName}>{instructor.name}</Text>
                <Text style={styles.instructorLabel}>Instructor</Text>
              </View>
            </View>
          )}

          {/* ── Rating ── */}
          <StarRow rating={course.averageRating} count={course.totalReviews} />

          {/* ── Meta row ── */}
          <View style={styles.metaRow}>
            {lessons.length > 0 ? (
              <View style={styles.metaItem}>
                <Ionicons name="book-outline" size={16} color="#888" />
                <Text style={styles.metaText}>
                  {lessons.length} Lessons{hoursText ? ` · ${hoursText}` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.comingSoonBadge}>
                <Ionicons name="time-outline" size={13} color="#888" />
                <Text style={styles.comingSoonText}>Content coming soon</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={16} color="#888" />
              <Text style={styles.metaText}>
                {formatCoursePrice(course)}
              </Text>
            </View>
          </View>

          {/* ── Progress bar (enrolled only) ── */}
          {enrollmentStatus && (
            <ProgressBar
              pct={courseProgress}
              completedLessons={completedLessons}
              totalLessons={lessons.length}
            />
          )}

          {/* ── Description ── */}
          <Text style={styles.description}>{course.description}</Text>

          {/* ── Community (enrolled only) ── */}
          {enrollmentStatus && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Community</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => navigation.navigate('DiscussionBoard', { courseId })}
                >
                  <Ionicons name="chatbubbles-outline" size={20} color={PRIMARY} />
                  <Text style={styles.outlineBtnText}>Discussions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => navigation.navigate('Feedback', { courseId })}
                >
                  <Ionicons name="star-outline" size={20} color={PRIMARY} />
                  <Text style={styles.outlineBtnText}>Feedback</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Assessments (enrolled only) ── */}
          {enrollmentStatus && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assessments</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => navigation.navigate('QuizList', { courseId })}
                >
                  <Ionicons name="document-text-outline" size={20} color={PRIMARY} />
                  <Text style={styles.outlineBtnText}>Quizzes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => navigation.navigate('AssignmentList', { courseId })}
                >
                  <Ionicons name="document-attach-outline" size={20} color={PRIMARY} />
                  <Text style={styles.outlineBtnText}>Assignments</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Live Classes (enrolled only) ── */}
          {enrollmentStatus && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Live Classes</Text>
              <TouchableOpacity
                style={[styles.outlineBtn, { width: '100%' }]}
                onPress={() => navigation.navigate('StudentLiveClasses', { 
                  courseId, 
                  courseName: course.title 
                })}
              >
                <Ionicons name="videocam-outline" size={20} color={PRIMARY} />
                <Text style={styles.outlineBtnText}>View Live Classes</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Course content ── */}
          <View style={styles.section}>
            <View style={styles.lessonHeader}>
              <Text style={styles.sectionTitle}>Course Content</Text>
              {enrollmentStatus && lessons.length > 0 && (
                <TouchableOpacity
                  style={styles.progressLink}
                  onPress={() => navigation.navigate('Progress', { courseId })}
                >
                  <Ionicons name="analytics-outline" size={13} color={PRIMARY} />
                  <Text style={styles.progressLinkText}>My Progress</Text>
                </TouchableOpacity>
              )}
            </View>

            {lessons.length > 0 ? (
              lessons.map((lesson, index) => (
                <TouchableOpacity
                  key={lesson._id}
                  style={[styles.lessonItem, !enrollmentStatus && styles.lessonLocked]}
                  onPress={() => handleLessonPress(lesson)}
                >
                  <View style={[styles.lessonNum, enrollmentStatus && styles.lessonNumActive]}>
                    <Text style={[styles.lessonNumText, enrollmentStatus && styles.lessonNumTextActive]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={[styles.lessonTitle, !enrollmentStatus && styles.lessonTitleLocked]}>
                      {lesson.title}
                    </Text>
                    {lesson.duration > 0 && (
                      <Text style={styles.lessonDuration}>{lesson.duration} min</Text>
                    )}
                  </View>
                  <Ionicons
                    name={enrollmentStatus ? 'play-circle-outline' : 'lock-closed-outline'}
                    size={22}
                    color={enrollmentStatus ? PRIMARY : '#ccc'}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noLessonsBox}>
                <Ionicons name="time-outline" size={32} color="#ccc" />
                <Text style={styles.noLessonsText}>Lessons coming soon</Text>
              </View>
            )}
          </View>

          {/* Bottom padding */}
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      {!enrollmentStatus ? (
        <View style={styles.footer}>
          <View style={styles.footerMeta}>
            <Ionicons name="people-outline" size={16} color="#888" />
            <Text style={styles.footerMetaText}>
              {course.totalStudents
                ? `Join ${course.totalStudents.toLocaleString()} students`
                : 'Be the first to enroll'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.enrollBtn, enrolling && styles.enrollBtnDisabled]}
            onPress={handleEnroll}
            disabled={enrolling}
          >
            <Text style={styles.enrollBtnText}>
              {enrolling ? 'Enrolling...' : (
                !course.price || course.price === 0
                  ? 'Enroll Free'
                  : `Enroll · ${formatCoursePrice(course)}`
              )}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              if (lessons.length > 0) {
                navigation.navigate('Lesson', { 
                  lessonId: lessons[0]._id, 
                  courseId: courseId 
                });
              }
            }}
          >
            <Ionicons name="play-circle-outline" size={20} color="#fff" />
            <Text style={styles.continueBtnText}>Continue Learning</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Thumbnail
  thumbContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 220,
    backgroundColor: '#E8E8F0',
  },
  thumbPlaceholder: {
    backgroundColor: PRIMARY + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Content
  content: {
    padding: 16,
  },

  // Title area
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: PRIMARY + '20',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43C67820',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  enrolledText: {
    fontSize: 12,
    color: '#43C678',
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
    lineHeight: 28,
  },

  // Instructor
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  instructorLabel: {
    fontSize: 12,
    color: '#888',
  },

  // Rating
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 13,
    color: '#888',
  },
  noReviews: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 12,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 6,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 16,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },

  // Progress
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#888',
  },
  progressBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },

  // Description
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
    marginLeft: 6,
  },

  // Lesson header
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  progressLinkText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Lesson items
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  lessonLocked: {
    opacity: 0.55,
    backgroundColor: '#fafafa',
  },
  lessonNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumActive: {
    backgroundColor: PRIMARY + '20',
  },
  lessonNumText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
  },
  lessonNumTextActive: {
    color: PRIMARY,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  lessonTitleLocked: {
    color: '#aaa',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#888',
  },
  noLessonsBox: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  noLessonsText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },

  // Footer
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  footerMetaText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 6,
  },
  enrollBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  enrollBtnDisabled: {
    opacity: 0.6,
  },
  enrollBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  continueBtn: {
    backgroundColor: '#43C678',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default CourseDetailScreen;
