import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import colors from '../../constants/colors';

const InstructorProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // Collapsible sections
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showProfessionalInfo, setShowProfessionalInfo] = useState(false);

  // Photo URL input
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/instructors/profile');
      
      const profile = response.data.data;
      setName(profile.name || '');
      setEmail(profile.email || '');
      setBio(profile.bio || '');
      setSpecialization(profile.specialization || '');
      setQualifications(profile.qualifications || '');
      setExperience(profile.experience || '');
      setPhone(profile.phone || '');
      setWebsite(profile.website || '');
      setProfilePicture(profile.profilePicture || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option:',
      [
        {
          text: 'Upload from Gallery',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant camera roll permissions');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8
              });

              if (!result.canceled && result.assets[0]) {
                uploadImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error picking image:', error);
              Alert.alert('Error', 'Failed to pick image');
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

  const uploadImage = async (uri) => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg'
      });

      const response = await api.post('/instructors/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000
      });

      setProfilePicture(response.data.data.url);
      Alert.alert('Success', 'Profile picture updated');
    } catch (error) {
      console.error('Error uploading image:', error);
      
      if (error.message === 'Network Error' || !error.response) {
        Alert.alert(
          'Upload Failed - Network Error',
          'File uploads don\'t work on local network.\n\nUse "Enter Photo URL" option instead, or deploy backend to cloud.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to upload image');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUrlSubmit = async () => {
    if (!photoUrlInput.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    if (!photoUrlInput.startsWith('http://') && !photoUrlInput.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }

    try {
      setSaving(true);
      setProfilePicture(photoUrlInput.trim());
      setShowPhotoUrlInput(false);
      setPhotoUrlInput('');
      Alert.alert('Success', 'Profile photo updated! Remember to save changes.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update photo');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setSaving(true);
      
      const response = await api.put('/instructors/profile', {
        name: name.trim(),
        bio: bio.trim(),
        specialization: specialization.trim(),
        qualifications: qualifications.trim(),
        experience: experience.trim(),
        phone: phone.trim(),
        website: website.trim(),
        profilePicture: profilePicture.trim()
      });

      // Update context
      if (updateUser) {
        updateUser({ ...user, name: name.trim() });
      }

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Picture Section */}
      <View style={styles.profilePictureSection}>
        <TouchableOpacity onPress={pickImage} style={styles.profilePictureContainer}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={[styles.profilePicture, styles.profilePicturePlaceholder]}>
              <Ionicons name="person" size={64} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.profilePictureHint}>Tap to change profile picture</Text>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowBasicInfo(!showBasicInfo)}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <Ionicons
            name={showBasicInfo ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {showBasicInfo && (
          <>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              placeholder="https://yourwebsite.com"
              value={website}
              onChangeText={setWebsite}
              keyboardType="url"
              autoCapitalize="none"
            />
          </>
        )}
      </View>

      {/* Professional Information */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowProfessionalInfo(!showProfessionalInfo)}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Professional Information</Text>
          </View>
          <Ionicons
            name={showProfessionalInfo ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {showProfessionalInfo && (
          <>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell students about yourself..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>

            <Text style={styles.label}>Specialization</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mathematics, Science, English"
              value={specialization}
              onChangeText={setSpecialization}
            />

            <Text style={styles.label}>Qualifications</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., B.Ed in Mathematics, M.Sc in Education"
              value={qualifications}
              onChangeText={setQualifications}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Teaching Experience</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your teaching experience..."
              value={experience}
              onChangeText={setExperience}
              multiline
              numberOfLines={3}
            />
          </>
        )}
      </View>

      {/* Role Badge */}
      <View style={styles.roleBadgeContainer}>
        <View style={styles.roleBadge}>
          <Ionicons name="school" size={20} color={colors.primary} />
          <Text style={styles.roleBadgeText}>Instructor</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
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
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Update Photo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
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
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
    marginBottom: 16
  },
  profilePictureContainer: {
    position: 'relative'
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  profilePicturePlaceholder: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white
  },
  profilePictureHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12
  },
  section: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 16
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
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text
  },
  disabledInput: {
    backgroundColor: colors.border,
    color: colors.textSecondary
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4
  },
  roleBadgeContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  roleBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  saveButton: {
    backgroundColor: colors.primary
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white
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
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default InstructorProfileScreen;
