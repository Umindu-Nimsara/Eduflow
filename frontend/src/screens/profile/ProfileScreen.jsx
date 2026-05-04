import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import colors from '../../constants/colors';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useContext(AuthContext);
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showProfileSection, setShowProfileSection] = useState(true);
  const [showProfessionalSection, setShowProfessionalSection] = useState(false);
  const [showAccountSection, setShowAccountSection] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoStatus, setPhotoStatus] = useState('idle'); // idle|uploading|done|error
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [enabling2FA, setEnabling2FA] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setMobile(userProfile.mobile || '');
      setBio(userProfile.bio || '');
      setDepartment(userProfile.department || '');
      setQualifications(userProfile.qualifications || '');
      setExperience(userProfile.experience || '');
      setOfficeLocation(userProfile.officeLocation || '');
      setTwoFactorEnabled(userProfile.twoFactorEnabled || false);
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${ENDPOINTS.AUTH}/me`);
      setUserProfile(response.data.data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to context user if API fails
      setUserProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setUpdatingProfile(true);
      
      const response = await api.put(`${ENDPOINTS.AUTH}/update-profile`, {
        name: name.trim(),
        mobile: mobile.trim(),
        bio: bio.trim(),
        department: department.trim(),
        qualifications: qualifications.trim(),
        experience: experience.trim(),
        officeLocation: officeLocation.trim()
      });

      // Update user context
      updateUser(response.data.data.user);
      setUserProfile(response.data.data.user);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      
      await api.put(`${ENDPOINTS.AUTH}/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword
      });

      Alert.alert('Success', 'Password changed successfully');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const pickPhoto = async () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option:',
      [
        {
          text: 'Upload from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Please allow access to your photo library');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              
              // Validate file size (max 5MB)
              if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                Alert.alert('File too large', 'Image must be under 5MB');
                return;
              }
              
              setPhotoFile(asset);
              uploadPhoto(asset);
            }
          }
        },
        {
          text: 'Enter Photo URL',
          onPress: () => setShowPhotoUrlInput(true)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handlePhotoUrlSubmit = async () => {
    if (!photoUrlInput.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Basic URL validation
    if (!photoUrlInput.startsWith('http://') && !photoUrlInput.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }

    try {
      setPhotoStatus('uploading');
      const updateResponse = await api.put(`${ENDPOINTS.AUTH}/upload-photo`, {
        photoUrl: photoUrlInput.trim()
      });

      const updatedUser = updateResponse.data.data.user;
      setUserProfile(updatedUser);
      updateUser(updatedUser);
      
      setPhotoStatus('done');
      setShowPhotoUrlInput(false);
      setPhotoUrlInput('');
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (err) {
      setPhotoStatus('error');
      Alert.alert('Error', err.response?.data?.message || 'Failed to update photo');
    }
  };

  const uploadPhoto = async (asset) => {
    setPhotoStatus('uploading');
    setPhotoProgress(0);
    try {
      console.log('Starting photo upload to backend...', asset.uri);
      
      // Upload to backend
      const formData = new FormData();
      formData.append('photo', {
        uri: asset.uri,
        type: asset.mimeType || asset.type || 'image/jpeg',
        name: asset.fileName || asset.name || `profile_${Date.now()}.jpg`,
      });
      
      const result = await api.post(ENDPOINTS.USER_UPLOAD_PHOTO, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('Upload progress:', progress + '%');
            setPhotoProgress(progress);
          }
        }
      });
      
      console.log('Photo upload result:', result.data);
      
      if (result.data.success && result.data.data?.url) {
        // Update profile with new photo URL
        const updateResponse = await api.put(`${ENDPOINTS.AUTH}/upload-photo`, {
          photoUrl: result.data.data.url
        });

        // Update local state
        const updatedUser = updateResponse.data.data.user;
        setUserProfile(updatedUser);
        updateUser(updatedUser);
        
        setPhotoStatus('done');
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error('Upload response missing URL');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setPhotoStatus('error');
      
      // Check if it's a network error
      if (err.message === 'Network Error' || err.code === 'ECONNABORTED' || !err.response) {
        Alert.alert(
          'Upload Failed - Network Error',
          'File uploads don\'t work on local network (10.214.148.69).\n\n' +
          'Solutions:\n' +
          '1. Deploy backend to Render.com or Heroku\n' +
          '2. Use Ngrok to expose local server\n' +
          '3. Use emulator instead of physical device\n\n' +
          'This is a known limitation with React Native file uploads on local IP.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Upload Failed', 
          err.response?.data?.message || err.message || 'Could not upload photo. Try again.'
        );
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggle2FA = async () => {
    if (twoFactorEnabled) {
      // Disable 2FA
      Alert.alert(
        'Disable 2FA',
        'Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                setEnabling2FA(true);
                await api.post(`${ENDPOINTS.AUTH}/disable-2fa`);
                setTwoFactorEnabled(false);
                Alert.alert('Success', '2FA has been disabled');
              } catch (error) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to disable 2FA');
              } finally {
                setEnabling2FA(false);
              }
            },
          },
        ]
      );
    } else {
      // Enable 2FA
      Alert.alert(
        'Enable 2FA',
        'Two-Factor Authentication adds an extra layer of security to your account. You will receive a verification code via email when logging in.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                setEnabling2FA(true);
                await api.post(`${ENDPOINTS.AUTH}/enable-2fa`);
                setTwoFactorEnabled(true);
                Alert.alert(
                  'Success',
                  '2FA has been enabled! You will receive a verification code via email on your next login.'
                );
              } catch (error) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to enable 2FA');
              } finally {
                setEnabling2FA(false);
              }
            },
          },
        ]
      );
    }
  };

  if (!user || loading) {
    return <LoadingSpinner />;
  }

  const displayUser = userProfile || user;

  const ProgressBar = ({ progress, status }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {status === 'uploading' ? `Uploading... ${progress}%` :
         status === 'done'      ? '✓ Uploaded successfully!' :
         status === 'error'     ? '✗ Upload failed' : ''}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={pickPhoto}
            disabled={photoStatus === 'uploading'}
            activeOpacity={0.8}
          >
            {photoStatus === 'uploading' ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : displayUser.profilePhoto ? (
              <Image 
                source={{ uri: displayUser.profilePhoto }} 
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={40} color="#fff" />
            )}
            
            {/* Camera icon overlay */}
            {photoStatus !== 'uploading' && (
              <View style={styles.cameraIconOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{displayUser.role}</Text>
          </View>
        </View>
        <Text style={styles.headerName}>{displayUser.name}</Text>
        <Text style={styles.headerEmail}>{displayUser.email}</Text>
        <Text style={styles.tapToChangeText}>Tap photo to change</Text>
        
        {/* Progress bar for photo upload */}
        {photoStatus !== 'idle' && (
          <View style={styles.headerProgressContainer}>
            <ProgressBar progress={photoProgress} status={photoStatus} />
          </View>
        )}
        
        {/* Retry button */}
        {photoStatus === 'error' && (
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => photoFile && uploadPhoto(photoFile)}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.retryText}>Retry Upload</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowProfileSection(!showProfileSection)}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={22} color={PRIMARY} />
            <Text style={styles.sectionTitle}>Profile Information</Text>
          </View>
          <Ionicons
            name={showProfileSection ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {showProfileSection && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={displayUser.email}
                editable={false}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Enter your mobile number"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                maxLength={15}
              />
              <Text style={styles.helperText}>10-15 digits only</Text>
            </View>

            <TouchableOpacity
              style={[styles.updateBtn, updatingProfile && styles.updateBtnDisabled]}
              onPress={handleUpdateProfile}
              disabled={updatingProfile}
            >
              {updatingProfile ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.updateBtnText}>Update Profile</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Professional Details - Admin Only */}
      {displayUser.role === 'admin' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowProfessionalSection(!showProfessionalSection)}
          >
            <View style={styles.sectionTitleRow}>
              <Ionicons name="briefcase" size={22} color={PRIMARY} />
              <Text style={styles.sectionTitle}>Professional Details</Text>
            </View>
            <Ionicons
              name={showProfessionalSection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>

          {showProfessionalSection && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio / About</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell about yourself and your role..."
                  placeholderTextColor="#aaa"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{bio.length}/500 characters</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Department / Role</Text>
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="e.g., System Administration, Academic Management"
                  placeholderTextColor="#aaa"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Qualifications</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={qualifications}
                  onChangeText={setQualifications}
                  placeholder="e.g., B.Sc in Computer Science, MBA"
                  placeholderTextColor="#aaa"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="Describe your professional experience..."
                  placeholderTextColor="#aaa"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Office Location</Text>
                <TextInput
                  style={styles.input}
                  value={officeLocation}
                  onChangeText={setOfficeLocation}
                  placeholder="e.g., Admin Block, Room 201"
                  placeholderTextColor="#aaa"
                />
              </View>

              <TouchableOpacity
                style={[styles.updateBtn, updatingProfile && styles.updateBtnDisabled]}
                onPress={handleUpdateProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.updateBtnText}>Update Professional Details</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Password Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowPasswordSection(!showPasswordSection)}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="lock-closed-outline" size={22} color="#FF6584" />
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>
          <Ionicons
            name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {showPasswordSection && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password *</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#aaa"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password *</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#aaa"
                secureTextEntry
              />
              <Text style={styles.helperText}>Minimum 6 characters</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#aaa"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.passwordBtn, changingPassword && styles.passwordBtnDisabled]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={20} color="#fff" />
                  <Text style={styles.passwordBtnText}>Change Password</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowAccountSection(!showAccountSection)}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={22} color="#26D0CE" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>
          <Ionicons
            name={showAccountSection ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {showAccountSection && (
          <>
            <View style={[styles.infoRow, { marginTop: 20 }]}>
              <Ionicons name="person-circle-outline" size={20} color="#888" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Type</Text>
                <Text style={styles.infoValue}>{displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#888" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Not available'}
                </Text>
              </View>
            </View>

            {displayUser.role === 'instructor' && (
              <TouchableOpacity 
                style={styles.infoRowButton}
                onPress={() => navigation.navigate('InstructorProfile')}
              >
                <Ionicons name="school-outline" size={20} color={PRIMARY} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Professional Profile</Text>
                  <Text style={[styles.infoValue, { color: PRIMARY }]}>Edit Instructor Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Security Section - Admin Only */}
      {displayUser.role === 'admin' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowSecuritySection(!showSecuritySection)}
          >
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#43C678" />
              <Text style={styles.sectionTitle}>Security</Text>
            </View>
            <Ionicons
              name={showSecuritySection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>

          {showSecuritySection && (
            <>
              <View style={[styles.securityRow, { marginTop: 20 }]}>
                <View style={styles.securityLeft}>
                  <Ionicons name="shield-checkmark" size={24} color={twoFactorEnabled ? '#43C678' : '#888'} />
                  <View style={styles.securityInfo}>
                    <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.securityDesc}>
                      {twoFactorEnabled 
                        ? 'Extra security is enabled' 
                        : 'Add an extra layer of security'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    twoFactorEnabled && styles.toggleActive,
                    enabling2FA && styles.toggleDisabled
                  ]}
                  onPress={handleToggle2FA}
                  disabled={enabling2FA}
                  activeOpacity={0.7}
                >
                  {enabling2FA ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={[
                      styles.toggleThumb,
                      twoFactorEnabled && styles.toggleThumbActive
                    ]} />
                  )}
                </TouchableOpacity>
              </View>

              {twoFactorEnabled && (
                <View style={styles.securityNote}>
                  <Ionicons name="information-circle" size={16} color="#43C678" />
                  <Text style={styles.securityNoteText}>
                    You will receive a verification code via email when logging in
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Photo URL Input Modal */}
      <Modal
        visible={showPhotoUrlInput}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPhotoUrlInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Photo URL</Text>
              <TouchableOpacity onPress={() => setShowPhotoUrlInput(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Enter a direct URL to your profile photo (e.g., from Imgur, Cloudinary, or any image hosting service)
              </Text>
              
              <TextInput
                style={styles.urlInput}
                value={photoUrlInput}
                onChangeText={setPhotoUrlInput}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor="#aaa"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <Text style={styles.modalNote}>
                💡 Tip: Upload your photo to Imgur.com and paste the direct link here
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowPhotoUrlInput(false);
                  setPhotoUrlInput('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handlePhotoUrlSubmit}
                disabled={photoStatus === 'uploading'}
              >
                {photoStatus === 'uploading' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Update Photo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  tapToChangeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  headerProgressContainer: {
    width: '80%',
    marginTop: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#43C678',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#43C678',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  headerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  inputGroup: {
    marginBottom: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#888',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  passwordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6584',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
  },
  passwordBtnDisabled: {
    opacity: 0.6,
  },
  passwordBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4757',
    borderRadius: 10,
    paddingVertical: 14,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 13,
    color: '#888',
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#43C678',
  },
  toggleDisabled: {
    opacity: 0.6,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43C67810',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#43C678',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f8f8',
    marginBottom: 12,
  },
  modalNote: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileScreen;