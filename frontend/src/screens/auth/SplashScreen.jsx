import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import colors from '../../constants/colors';
import strings from '../../constants/strings';

const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 1000);
    }
  }, [loading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.APP_NAME}</Text>
      <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
