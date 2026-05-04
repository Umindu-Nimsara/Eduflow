import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const { width } = Dimensions.get('window');

const PRIMARY = '#6C63FF';

const LessonScreen = ({ route, navigation }) => {
  const { lessonId, courseId } = route.params;
  const { user } = useContext(AuthContext);
  
  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoRef, setVideoRef] = useState(null);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Fetch lesson details first
      const lessonRes = await api.get(`${ENDPOINTS.LESSONS}/${lessonId}?_t=${new Date().getTime()}`);
      const lessonData = lessonRes.data.data;
      setLesson(lessonData);
      
      // Use courseId from params or lesson data
      const actualCourseId = courseId || lessonData.courseId;
      
      // Fetch all course lessons
      const lessonsRes = await api.get(`${ENDPOINTS.COURSES}/${actualCourseId}/lessons`);
      setAllLessons(lessonsRes.data.data || []);
      
      // Check if lesson is already completed
      if (user && actualCourseId) {
        await checkLessonProgress(actualCourseId);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load lesson:', err);
      setError(err.response?.data?.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const checkLessonProgress = async (actualCourseId) => {
    try {
      const response = await api.get(`${ENDPOINTS.PROGRESS}/${user.id}/${actualCourseId}`);
      const progressData = response.data.data || [];
      const lessonProgress = progressData.find(p => p.lessonId._id === lessonId);
      setIsCompleted(lessonProgress?.completed || false);
    } catch (err) {
      console.log('Progress check error:', err);
    }
  };

  const markAsComplete = async () => {
    if (!lesson || isMarkingComplete) return;
    
    try {
      setIsMarkingComplete(true);
      
      // Use courseId from params or lesson data
      const actualCourseId = courseId || lesson.courseId;
      
      await api.post(`${ENDPOINTS.PROGRESS}/update`, {
        courseId: actualCourseId,
        lessonId: lesson._id,
        completed: true,
        watchedDuration: lesson.duration || 0
      });
      
      setIsCompleted(true);
      Alert.alert('✅ Lesson Complete!', 'Great job! Your progress has been updated.');
      
    } catch (err) {
      Alert.alert('Error', 'Failed to update progress. Please try again.');
      console.error('Progress update error:', err);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const goToNextLesson = () => {
    if (!allLessons.length) return;
    
    const currentIndex = allLessons.findIndex(l => l._id === lessonId);
    const nextLesson = allLessons[currentIndex + 1];
    
    if (nextLesson) {
      // Use courseId from params or lesson data
      const actualCourseId = courseId || lesson.courseId;
      navigation.replace('Lesson', { 
        lessonId: nextLesson._id, 
        courseId: actualCourseId 
      });
    } else {
      Alert.alert(
        '🎉 Course Complete!', 
        'Congratulations! You\'ve finished all lessons in this course.',
        [
          { text: 'Back to Course', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const onVideoStatusUpdate = (status) => {
    if (status.isLoaded && status.durationMillis) {
      const progress = (status.positionMillis / status.durationMillis) * 100;
      setVideoProgress(progress);
      
      // Auto-mark as complete when video reaches 90%
      if (progress >= 90 && !isCompleted) {
        markAsComplete();
      }
    }
  };

  const handleOpenPDF = async () => {
    if (!lesson?.pdfUrl) return;
    try {
      const supported = await Linking.canOpenURL(lesson.pdfUrl);
      if (supported) {
        await Linking.openURL(lesson.pdfUrl);
      } else {
        Alert.alert('Error', 'Cannot open PDF file');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open PDF');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchLessonData} />;
  }

  if (!lesson) {
    return <ErrorView message="Lesson not found" />;
  }

  const hasVideo = lesson.videoUrl && lesson.videoUrl.trim() !== '';
  const hasPDF = lesson.pdfUrl && lesson.pdfUrl.trim() !== '';
  
  // Check if video is YouTube
  const isYouTube = hasVideo && (
    lesson.videoUrl.includes('youtube.com') || 
    lesson.videoUrl.includes('youtu.be')
  );
  
  // Extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(lesson.videoUrl) : null;
  
  // Check if video is Google Drive
  const isGoogleDrive = hasVideo && lesson.videoUrl.includes('drive.google.com');
  
  // Extract Google Drive file ID and create direct download URL
  const getGoogleDriveFileId = (url) => {
    // Handle both /d/ and /file/d/ patterns
    let match = url.match(/\/d\/([^/?]+)/);
    if (!match) {
      match = url.match(/\/file\/d\/([^/?]+)/);
    }
    // Also handle id= parameter
    if (!match) {
      match = url.match(/[?&]id=([^&]+)/);
    }
    return match ? match[1] : null;
  };
  
  const driveFileId = isGoogleDrive ? getGoogleDriveFileId(lesson.videoUrl) : null;
  
  // Create direct Google Drive video URL for native player
  const getDriveDirectUrl = (fileId) => {
    // This creates a direct video stream URL that works with native Video component
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  };
  
  const driveDirectUrl = driveFileId ? getDriveDirectUrl(driveFileId) : null;
  
  // Check if video is Dropbox
  const isDropbox = hasVideo && lesson.videoUrl.includes('dropbox.com');
  
  // Convert Dropbox share link to direct link
  const getDropboxDirectUrl = (url) => {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
  };
  
  const dropboxDirectUrl = isDropbox ? getDropboxDirectUrl(lesson.videoUrl) : null;
  
  // Check if video is Cloudinary
  const isCloudinary = hasVideo && lesson.videoUrl.includes('cloudinary.com');
  
  // Check if video is direct URL (MP4, etc.) or Cloudinary
  const isDirectVideo = hasVideo && (isCloudinary || (!isYouTube && !isGoogleDrive && !isDropbox));
  
  // Find current lesson position
  const currentIndex = allLessons.findIndex(l => l._id === lessonId);
  const isLastLesson = currentIndex === allLessons.length - 1;
  const nextLesson = allLessons[currentIndex + 1];
  
  const handleOpenVideo = async () => {
    if (!lesson?.videoUrl) return;
    try {
      const supported = await Linking.canOpenURL(lesson.videoUrl);
      if (supported) {
        await Linking.openURL(lesson.videoUrl);
      } else {
        Alert.alert('Error', 'Cannot open video URL');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open video');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Direct Video URLs (MP4, etc.) and Cloudinary */}
        {isDirectVideo && (
          <View>
            <Video
              ref={setVideoRef}
              source={{ uri: lesson.videoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              shouldPlay={false}
              onPlaybackStatusUpdate={onVideoStatusUpdate}
              onError={(error) => {
                console.log('Video playback error:', error);
                console.log('Video URL:', lesson.videoUrl);
                Alert.alert(
                  'Video Error',
                  'Could not load video. Please check your internet connection or try again later.',
                  [
                    { text: 'Retry', onPress: () => fetchLessonData() },
                    { text: 'OK' }
                  ]
                );
              }}
              onLoad={() => {
                console.log('Video loaded successfully:', lesson.videoUrl);
              }}
            />
            {isCloudinary && (
              <View style={styles.videoInfo}>
                <Ionicons name="cloud-done-outline" size={14} color="#43C678" />
                <Text style={styles.videoInfoText}>Cloudinary Video</Text>
              </View>
            )}
          </View>
        )}

        {/* Dropbox Video - Use direct URL with native Video player */}
        {isDropbox && dropboxDirectUrl && (
          <Video
            ref={setVideoRef}
            source={{ uri: dropboxDirectUrl }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
            onPlaybackStatusUpdate={onVideoStatusUpdate}
          />
        )}

        {/* YouTube Video - WebView with HTML5 embed */}
        {isYouTube && youtubeVideoId && (
          <View style={styles.videoPlayerContainer}>
            <WebView
              style={styles.webview}
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                      <style>
                        * { margin: 0; padding: 0; }
                        body { background: #000; overflow: hidden; }
                        .video-container {
                          position: relative;
                          width: 100%;
                          height: 100vh;
                          overflow: hidden;
                        }
                        iframe {
                          position: absolute;
                          top: 0;
                          left: 0;
                          width: 100%;
                          height: 100%;
                          border: none;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="video-container">
                        <iframe
                          src="https://www.youtube.com/embed/${youtubeVideoId}?playsinline=1&rel=0&modestbranding=1&controls=1&enablejsapi=1"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowfullscreen
                          frameborder="0"
                        ></iframe>
                      </div>
                    </body>
                  </html>
                `
              }}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={false}
              bounces={false}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.log('YouTube WebView error:', nativeEvent);
              }}
            />
            <View style={styles.fallbackButtonContainer}>
              <TouchableOpacity style={styles.fallbackButton} onPress={handleOpenVideo}>
                <Ionicons name="logo-youtube" size={16} color="#FF0000" />
                <Text style={styles.fallbackButtonText}>Open in YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Google Drive Video - Native player with direct URL */}
        {isGoogleDrive && driveDirectUrl && (
          <View>
            <Video
              ref={setVideoRef}
              source={{ uri: driveDirectUrl }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              shouldPlay={false}
              onPlaybackStatusUpdate={onVideoStatusUpdate}
              onError={(error) => {
                console.log('Google Drive video error:', error);
                Alert.alert(
                  'Video Error',
                  'Could not load video from Google Drive. Make sure the video is shared publicly.',
                  [
                    { text: 'Open in Browser', onPress: handleOpenVideo },
                    { text: 'OK' }
                  ]
                );
              }}
            />
            <View style={styles.videoOverlay}>
              <TouchableOpacity style={styles.overlayButton} onPress={handleOpenVideo}>
                <Ionicons name="logo-google" size={16} color="#4285F4" />
                <Text style={styles.overlayButtonText}>Open in Drive</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* PDF Viewer */}
        {hasPDF && !hasVideo && (
          <View style={styles.pdfContainer}>
            <View style={styles.pdfIcon}>
              <Ionicons name="document-text" size={64} color="#EF4444" />
            </View>
            <Text style={styles.pdfTitle}>PDF Document</Text>
            <TouchableOpacity style={styles.openPdfBtn} onPress={handleOpenPDF}>
              <Ionicons name="open-outline" size={20} color="#fff" />
              <Text style={styles.openPdfText}>Open PDF</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No content warning */}
        {!hasVideo && !hasPDF && (
          <View style={styles.noContentContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
            <Text style={styles.noContentText}>No content available</Text>
            <Text style={styles.noContentHint}>This lesson doesn't have any video or PDF content yet.</Text>
          </View>
        )}
        
        {/* Debug info for invalid video URL */}
        {hasVideo && !isYouTube && !isGoogleDrive && !isDropbox && !isDirectVideo && (
          <View style={styles.noContentContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
            <Text style={styles.noContentText}>Invalid Video URL</Text>
            <Text style={styles.noContentHint}>The video URL format is not recognized.</Text>
            <Text style={styles.debugUrl} numberOfLines={3}>{lesson.videoUrl}</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Progress indicator */}
          {hasVideo && videoProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${videoProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(videoProgress)}% watched</Text>
            </View>
          )}

          {/* Completion status */}
          {isCompleted && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#43C678" />
              <Text style={styles.completedText}>✅ Lesson Completed</Text>
            </View>
          )}

          {/* Lesson type badge */}
          <View style={styles.badgeRow}>
            {hasVideo && (
              <View style={[styles.typeBadge, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="videocam" size={14} color="#3B82F6" />
                <Text style={[styles.typeBadgeText, { color: '#3B82F6' }]}>Video Lesson</Text>
              </View>
            )}
            {hasPDF && (
              <View style={[styles.typeBadge, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="document-text" size={14} color="#EF4444" />
                <Text style={[styles.typeBadgeText, { color: '#EF4444' }]}>PDF Lesson</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{lesson.title}</Text>
          
          {lesson.duration > 0 && (
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <Text style={styles.duration}>{lesson.duration} minutes</Text>
            </View>
          )}
          
          {lesson.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{lesson.description}</Text>
            </View>
          )}

          {lesson.resources && lesson.resources.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resources</Text>
              {lesson.resources.map((resource, index) => (
                <Text key={index} style={styles.resource}>• {resource}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action buttons footer */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {/* Mark as Complete button */}
          {!isCompleted && (
            <TouchableOpacity
              style={[styles.completeBtn, isMarkingComplete && styles.completeBtnDisabled]}
              onPress={markAsComplete}
              disabled={isMarkingComplete}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.completeBtnText}>
                {isMarkingComplete ? 'Updating...' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Next Lesson button */}
          {isCompleted && (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={goToNextLesson}
            >
              <Text style={styles.nextBtnText}>
                {isLastLesson ? 'Course Complete!' : 'Next Lesson'}
              </Text>
              <Ionicons 
                name={isLastLesson ? "trophy-outline" : "arrow-forward"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  video: {
    width: '100%',
    height: 250,
    backgroundColor: colors.black,
  },
  videoInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  videoInfoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#43C678',
    marginLeft: 4,
  },
  videoOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  overlayButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 4,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.black,
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: 250,
    backgroundColor: colors.black,
  },
  fallbackButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  fallbackButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 4,
  },
  pdfContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pdfIcon: {
    marginBottom: 16,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  openPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  openPdfText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  noContentContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 20,
  },
  noContentText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 12,
    fontWeight: '600',
  },
  noContentHint: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 6,
    textAlign: 'center',
  },
  debugUrl: {
    fontSize: 10,
    color: '#999',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Space for footer
  },
  
  // Progress tracking
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  
  // Completion status
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43C67820',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#43C678',
    marginLeft: 8,
  },
  
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  duration: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  resource: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  
  // Footer with action buttons
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43C678',
    borderRadius: 12,
    paddingVertical: 14,
  },
  completeBtnDisabled: {
    opacity: 0.6,
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
});

export default LessonScreen;
