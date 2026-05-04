import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PRIMARY = '#6C63FF';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!currentPassword) e.currentPassword = 'Current password is required';
    if (!newPassword) e.newPassword = 'New password is required';
    else if (newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (currentPassword && newPassword && currentPassword === newPassword) {
      e.newPassword = 'New password must be different from current password';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await api.put(ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      Alert.alert(
        '✅ Success',
        'Your password has been changed successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to change password. Please check your current password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ msg }) => (msg ? <Text style={styles.fieldError}>{msg}</Text> : null);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={32} color={PRIMARY} />
          </View>
          <Text style={styles.headerTitle}>Change Password</Text>
          <Text style={styles.headerSub}>
            Choose a strong password to keep your account secure
          </Text>
        </View>

        {/* Current Password */}
        <Text style={styles.label}>Current Password *</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, errors.currentPassword && styles.inputError]}
            value={currentPassword}
            onChangeText={(t) => {
              setCurrentPassword(t);
              if (errors.currentPassword) setErrors((p) => ({ ...p, currentPassword: '' }));
            }}
            placeholder="Enter current password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showCurrent}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowCurrent(!showCurrent)}
          >
            <Ionicons
              name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        <FieldError msg={errors.currentPassword} />

        {/* New Password */}
        <Text style={styles.label}>New Password *</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, errors.newPassword && styles.inputError]}
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: '' }));
            }}
            placeholder="Enter new password (min 6 chars)"
            placeholderTextColor="#aaa"
            secureTextEntry={!showNew}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowNew(!showNew)}
          >
            <Ionicons
              name={showNew ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        <FieldError msg={errors.newPassword} />

        {/* Confirm Password */}
        <Text style={styles.label}>Confirm New Password *</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }));
            }}
            placeholder="Re-enter new password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowConfirm(!showConfirm)}
          >
            <Ionicons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        <FieldError msg={errors.confirmPassword} />

        {/* Password Requirements */}
        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <View style={styles.requirementRow}>
            <Ionicons
              name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={newPassword.length >= 6 ? '#43C678' : '#ccc'}
            />
            <Text style={styles.requirementText}>At least 6 characters</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons
              name={
                newPassword && confirmPassword && newPassword === confirmPassword
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={16}
              color={
                newPassword && confirmPassword && newPassword === confirmPassword
                  ? '#43C678'
                  : '#ccc'
              }
            />
            <Text style={styles.requirementText}>Passwords match</Text>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[
            styles.changeBtn,
            (!currentPassword || !newPassword || !confirmPassword || loading) &&
              styles.changeBtnDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={!currentPassword || !newPassword || !confirmPassword || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
              <Text style={styles.changeBtnText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Tip */}
        <View style={styles.tipBox}>
          <Ionicons name="information-circle-outline" size={20} color={PRIMARY} />
          <Text style={styles.tipText}>
            For security, you'll be logged out after changing your password. Please log in again
            with your new password.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  form: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  headerSub: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 16,
  },
  passwordRow: { position: 'relative' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    paddingRight: 50,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputError: { borderColor: '#EF4444' },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  fieldError: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 2 },
  requirementsBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  requirementsTitle: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  requirementText: { fontSize: 13, color: '#888', marginLeft: 8 },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
  },
  changeBtnDisabled: { opacity: 0.5 },
  changeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: PRIMARY + '10',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    marginBottom: 32,
  },
  tipText: { flex: 1, fontSize: 12, color: '#555', marginLeft: 10, lineHeight: 18 },
});

export default ChangePasswordScreen;
