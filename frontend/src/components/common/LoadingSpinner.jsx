import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const LoadingSpinner = ({ text = '', size = 'large', color = '#6C63FF' }) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color={color} />
    {!!text && <Text style={styles.text}>{text}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
