import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import colors from '../../constants/colors';

const SettingsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    autoPlay: true,
    downloadQuality: 'high',
    language: 'english',
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const showComingSoon = () => {
    Alert.alert('Coming Soon', 'This feature will be available in a future update.');
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language',
      'Select your preferred language',
      [
        { text: 'English', onPress: () => {} },
        { text: 'Sinhala', onPress: () => {} },
        { text: 'Tamil', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleQualityChange = () => {
    Alert.alert(
      'Video Quality',
      'Select default video quality',
      [
        { text: 'High (720p)', onPress: () => setSettings(prev => ({ ...prev, downloadQuality: 'high' })) },
        { text: 'Medium (480p)', onPress: () => setSettings(prev => ({ ...prev, downloadQuality: 'medium' })) },
        { text: 'Low (360p)', onPress: () => setSettings(prev => ({ ...prev, downloadQuality: 'low' })) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>All Notifications</Text>
              <Text style={styles.settingDescription}>Enable all notifications</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={() => toggleSetting('notifications')}
            trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
            thumbColor={settings.notifications ? colors.primary : colors.gray[500]}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications via email</Text>
            </View>
          </View>
          <Switch
            value={settings.emailNotifications}
            onValueChange={() => toggleSetting('emailNotifications')}
            trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
            thumbColor={settings.emailNotifications ? colors.primary : colors.gray[500]}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications on device</Text>
            </View>
          </View>
          <Switch
            value={settings.pushNotifications}
            onValueChange={() => toggleSetting('pushNotifications')}
            trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
            thumbColor={settings.pushNotifications ? colors.primary : colors.gray[500]}
          />
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Enable dark theme</Text>
            </View>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={() => toggleSetting('darkMode')}
            trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
            thumbColor={settings.darkMode ? colors.primary : colors.gray[500]}
          />
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
          <View style={styles.settingInfo}>
            <Ionicons name="language-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Language</Text>
              <Text style={styles.settingDescription}>English</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Video & Audio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video & Audio</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="play-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto-play Videos</Text>
              <Text style={styles.settingDescription}>Automatically play next video</Text>
            </View>
          </View>
          <Switch
            value={settings.autoPlay}
            onValueChange={() => toggleSetting('autoPlay')}
            trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
            thumbColor={settings.autoPlay ? colors.primary : colors.gray[500]}
          />
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handleQualityChange}>
          <View style={styles.settingInfo}>
            <Ionicons name="videocam-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Video Quality</Text>
              <Text style={styles.settingDescription}>
                {settings.downloadQuality === 'high' ? 'High (720p)' : 
                 settings.downloadQuality === 'medium' ? 'Medium (480p)' : 'Low (360p)'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Privacy & Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={showComingSoon}>
          <View style={styles.settingInfo}>
            <Ionicons name="shield-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>View our privacy policy</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={showComingSoon}>
          <View style={styles.settingInfo}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Terms of Service</Text>
              <Text style={styles.settingDescription}>View terms and conditions</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={showComingSoon}>
          <View style={styles.settingInfo}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your password</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={showComingSoon}>
          <View style={styles.settingInfo}>
            <Ionicons name="download-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Downloaded Content</Text>
              <Text style={styles.settingDescription}>Manage offline content</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={showComingSoon}>
          <View style={styles.settingInfo}>
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Clear Cache</Text>
              <Text style={styles.settingDescription}>Free up storage space</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>App Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={showComingSoon}>
          <View style={styles.settingInfo}>
            <Ionicons name="star-outline" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Rate App</Text>
              <Text style={styles.settingDescription}>Rate us on app store</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
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
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default SettingsScreen;