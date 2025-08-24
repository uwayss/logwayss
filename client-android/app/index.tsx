
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Link href="/profile" style={styles.link}>Go to Profile</Link>
      <Link href="/entries" style={styles.link}>View Entries</Link>
      <Link href="/entry/new" style={styles.link}>Create New Entry</Link>
      <Link href="/settings" style={styles.link}>Go to Settings</Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  link: {
    fontSize: 18,
    color: 'blue',
    marginVertical: 5,
  }
});

export default HomeScreen;
