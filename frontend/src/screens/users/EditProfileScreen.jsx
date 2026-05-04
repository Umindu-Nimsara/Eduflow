import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import colors from '../../constants/colors';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(user.id);
      const profile = response.data.profile;
      
      setName(response.data.user.name || '');
      setPhone(profile?.phone || '');
      setAddress(profile?.address || '');
      setProfilePhoto(profile?.profilePhoto || '');
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      const fileName = uri.split('/').pop() || 'profile.jpg';
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: fileName,
      });

      const response = await userService.uploadPhoto(formData);
      setProfilePhoto(response.data.url);
      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (err) {
      console.error('Photo upload error:', err?.response?.data || err?.message || err);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    try {
      setSaving(true);
      await userService.updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      // Update user in context
      await updateUser({ ...user, name: name.trim() });

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={50} color={colors.textLight} />
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              editable={!saving}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email}
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputDisabled: {
    backgroundColor: colors.gray[100],
    color: colors.textSecondary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
