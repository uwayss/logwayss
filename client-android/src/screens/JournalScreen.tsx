import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Core } from '../core';
import { Entry } from '@logwayss/core';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'Journal'>;

export default function JournalScreen({ route, navigation }: Props) {
  const { core } = route.params;
  const [entryText, setEntryText] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);

  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      const entries = await core.query({ type: 'text' });
      setRecentEntries(entries.slice(0, 5)); // Show last 5 entries
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const handleSaveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Error', 'Please enter some text for your journal entry');
      return;
    }

    setIsSaving(true);
    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const entry = await core.createEntry({
        type: 'text',
        payload: { content: entryText.trim() },
        tags: tagArray.length > 0 ? tagArray : undefined
      });

      Alert.alert('Success', 'Journal entry saved!');
      setEntryText('');
      setTags('');
      
      // Refresh recent entries
      loadRecentEntries();
    } catch (error: any) {
      Alert.alert('Error', `Failed to save entry: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLock = () => {
    core.lock();
    navigation.navigate('Lock', { core });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.lockButton} onPress={handleLock}>
            <Text style={styles.lockButtonText}>Lock</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.entryForm}>
          <Text style={styles.label}>What's on your mind?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={entryText}
            onChangeText={setEntryText}
            placeholder="Write your thoughts, experiences, or reflections..."
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Tags (optional)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="work, personal, ideas (comma separated)"
          />

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveEntry}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentEntries}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {recentEntries.length === 0 ? (
            <Text style={styles.noEntriesText}>No entries yet. Start journaling!</Text>
          ) : (
            recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={styles.entryContent} numberOfLines={3}>
                  {(entry.payload as any)?.content}
                </Text>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </Text>
                  {entry.tags && entry.tags.length > 0 && (
                    <Text style={styles.entryTags}>
                      {entry.tags.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4a90e2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  lockButton: {
    padding: 8,
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  entryForm: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 120,
  },
  saveButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#aaa',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  recentEntries: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  noEntriesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  entryTags: {
    fontSize: 12,
    color: '#4a90e2',
  },
});