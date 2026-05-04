import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import colors from '../../constants/colors';

const MessagesListScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => navigation.navigate('DirectMessage', {
        userId: item.user._id,
        userName: item.user.name
      })}
    >
      <View style={styles.avatarContainer}>
        {item.user.profilePicture ? (
          <Image
            source={{ uri: item.user.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.timeText}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={() => navigation.navigate('StudentListForMessage')}
        >
          <Text style={styles.newMessageText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptyText}>
            Start a conversation with your students
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('StudentListForMessage')}
          >
            <Text style={styles.startButtonText}>Start Messaging</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.user._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text
  },
  newMessageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  newMessageText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14
  },
  listContainer: {
    padding: 16
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold'
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.text
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default MessagesListScreen;
