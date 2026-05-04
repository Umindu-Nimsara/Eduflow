import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptyState = ({
  icon = 'folder-open-outline',
  title = 'Nothing here yet',
  description = '',
  actionLabel = '',
  onAction = null,
}) => (
  <View style={styles.container}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={48} color="#6C63FF" />
    </View>
    <Text style={styles.title}>{title}</Text>
    {!!description && <Text style={styles.description}>{description}</Text>}
    {!!actionLabel && !!onAction && (
      <TouchableOpacity style={styles.button} onPress={onAction}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6C63FF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EmptyState;
