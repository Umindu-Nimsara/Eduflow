import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { discussionService } from '../../services/discussionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import colors from '../../constants/colors';

const DiscussionDetailScreen = ({ route, navigation }) => {
  const { discussionId } = route.params;
  const { user } = useContext(AuthContext);
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscussionDetails();
  }, [discussionId]);

  const fetchDiscussionDetails = async () => {
    try {
      setLoading(true);
      const [discussionRes, repliesRes] = await Promise.all([
        discussionService.getDiscussionById(discussionId),
        discussionService.getRepliesByDiscussion(discussionId),
      ]);
      setDiscussion(discussionRes.data);
      setReplies(repliesRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeDiscussion = async () => {
    try {
      await discussionService.likeDiscussion(discussionId);
      fetchDiscussionDetails();
    } catch (err) {
      Alert.alert('Error', 'Failed to like discussion');
    }
  };

  const handleLikeReply = async (replyId) => {
    try {
      await discussionService.likeReply(replyId);
      fetchDiscussionDetails();
    } catch (err) {
      Alert.alert('Error', 'Failed to like reply');
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      await discussionService.createReply({
        discussionId,
        content: replyText,
      });
      setReplyText('');
      fetchDiscussionDetails();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = () => {
    navigation.navigate('Report', {
      contentType: 'discussion',
      contentId: discussionId,
    });
  };

  const handleEditDiscussion = () => {
    navigation.navigate('EditDiscussion', {
      discussionId: discussion._id,
      currentTitle: discussion.title,
      currentContent: discussion.content,
    });
  };

  const handleDeleteDiscussion = () => {
    Alert.alert(
      'Delete Discussion',
      'Are you sure you want to delete this discussion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await discussionService.deleteDiscussion(discussionId);
              Alert.alert('Success', 'Discussion deleted successfully');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete discussion');
            }
          },
        },
      ]
    );
  };

  const handleEditReply = (reply) => {
    Alert.prompt(
      'Edit Reply',
      'Update your reply',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newContent) => {
            if (!newContent?.trim()) return;
            try {
              await discussionService.updateReply(reply._id, { content: newContent });
              fetchDiscussionDetails();
              Alert.alert('Success', 'Reply updated successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to update reply');
            }
          },
        },
      ],
      'plain-text',
      reply.content
    );
  };

  const handleDeleteReply = (replyId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await discussionService.deleteReply(replyId);
              fetchDiscussionDetails();
              Alert.alert('Success', 'Reply deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete reply');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchDiscussionDetails} />;
  }

  const isLiked = discussion.likes?.includes(user.id);
  const isDiscussionOwner = discussion.userId?._id === user.id;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.content}>
        <View style={styles.discussionCard}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={colors.white} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{discussion.userId?.name || 'Unknown User'}</Text>
                <Text style={styles.timestamp}>
                  {new Date(discussion.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {isDiscussionOwner && (
                <>
                  <TouchableOpacity 
                    onPress={handleEditDiscussion}
                    style={styles.iconButton}
                  >
                    <Ionicons name="create-outline" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleDeleteDiscussion}
                    style={styles.iconButton}
                  >
                    <Ionicons name="trash-outline" size={24} color={colors.danger} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={handleReport}>
                <Ionicons name="flag-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.title}>{discussion.title}</Text>
          <Text style={styles.content}>{discussion.content}</Text>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLikeDiscussion}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? colors.danger : colors.textSecondary} 
              />
              <Text style={styles.actionText}>{discussion.likes?.length || 0}</Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.actionText}>{replies.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.repliesSection}>
          <Text style={styles.repliesTitle}>Replies ({replies.length})</Text>
          {replies.map((reply) => {
            const isReplyOwner = reply.userId?._id === user.id;
            return (
            <View key={reply._id} style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.replyAvatar}>
                    <Ionicons name="person" size={16} color={colors.white} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.replyUserName}>{reply.userId?.name || 'Unknown User'}</Text>
                    <Text style={styles.replyTimestamp}>
                      {new Date(reply.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
                {isReplyOwner && (
                  <View style={styles.replyActions}>
                    <TouchableOpacity 
                      onPress={() => handleEditReply(reply)}
                      style={styles.replyActionButton}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDeleteReply(reply._id)}
                      style={styles.replyActionButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.replyContent}>{reply.content}</Text>
              <TouchableOpacity 
                style={styles.replyLike}
                onPress={() => handleLikeReply(reply._id)}
              >
                <Ionicons 
                  name={reply.likes?.includes(user.id) ? "heart" : "heart-outline"} 
                  size={16} 
                  color={reply.likes?.includes(user.id) ? colors.danger : colors.textSecondary} 
                />
                <Text style={styles.replyLikeText}>{reply.likes?.length || 0}</Text>
              </TouchableOpacity>
            </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.replyInput}>
        <TextInput
          style={styles.input}
          placeholder="Write a reply..."
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
          onPress={handleSubmitReply}
          disabled={submitting}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  discussionCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  repliesSection: {
    backgroundColor: colors.white,
    padding: 16,
  },
  repliesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  replyCard: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyActionButton: {
    padding: 4,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  replyUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  replyTimestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  replyContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  replyLike: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyLikeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  replyInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

export default DiscussionDetailScreen;
