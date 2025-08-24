import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { Core } from './src/core';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [core] = useState(() => new Core());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [createdEntryId, setCreatedEntryId] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const dataDir = FileSystem.documentDirectory + 'logwayss';
  const exportPath = FileSystem.documentDirectory + 'export.lwx';

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const testProfileCreate = async () => {
    try {
      await core.createProfile(dataDir, 'password');
      setIsUnlocked(true);
      addTestResult('✅ Profile: can be created');
    } catch (error: any) {
      addTestResult(`❌ Profile: can be created - ${error.message}`);
    }
  };

  const testProfileUnlockAndLock = async () => {
    try {
      // Lock first to ensure we're testing the unlock
      await core.lock();
      setIsUnlocked(false);
      
      // Unlock
      await core.unlockProfile(dataDir, 'password');
      if (!core.isUnlocked()) {
        throw new Error('isUnlocked returned false after unlock');
      }
      
      // Lock
      await core.lock();
      if (core.isUnlocked()) {
        throw new Error('isUnlocked returned true after lock');
      }
      
      // Unlock again for subsequent tests
      await core.unlockProfile(dataDir, 'password');
      setIsUnlocked(true);
      
      addTestResult('✅ Profile: can be unlocked and locked');
    } catch (error: any) {
      addTestResult(`❌ Profile: can be unlocked and locked - ${error.message}`);
    }
  };

  const testEntryCreate = async () => {
    try {
      const newEntry = {
        type: 'text' as const,
        payload: { text: 'hello' },
      };
      const createdEntry = await core.createEntry(newEntry);
      if (!createdEntry.id) {
        throw new Error('createEntry returned an entry with no ID');
      }
      setCreatedEntryId(createdEntry.id);
      addTestResult('✅ Entries: can be created');
    } catch (error: any) {
      addTestResult(`❌ Entries: can be created - ${error.message}`);
    }
  };

  const testEntryRetrieve = async () => {
    try {
      if (!createdEntryId) {
        throw new Error('No entry ID available');
      }
      
      const got = await core.getEntry(createdEntryId);
      if (got.id !== createdEntryId) throw new Error('getEntry ID mismatch');
      if ((got.payload as any)?.text !== 'hello') {
        throw new Error('getEntry payload mismatch');
      }
      addTestResult('✅ Entries: can be retrieved');
    } catch (error: any) {
      addTestResult(`❌ Entries: can be retrieved - ${error.message}`);
    }
  };

  const testEntryQuery = async () => {
    try {
      if (!createdEntryId) {
        throw new Error('No entry ID available for query test');
      }
      
      const res = await core.query({ type: 'text' }, { limit: 10 });
      // Check if our created entry is in the results
      const found = res.some(entry => entry.id === createdEntryId);
      if (!found) {
        throw new Error(`query result mismatch: created entry not found in ${res.length} results`);
      }
      addTestResult('✅ Entries: can be queried');
    } catch (error: any) {
      addTestResult(`❌ Entries: can be queried - ${error.message}`);
    }
  };

  const testEntryValidation = async () => {
    try {
      // Test valid entry first
      const validEntry = {
        type: 'text' as const,
        payload: { text: 'valid entry' },
      };
      await core.createEntry(validEntry);

      // Test invalid entry type - this should throw a ValidationError
      let validationErrorCaught = false;
      try {
        const invalidTypeEntry = {
          type: 'invalid_type' as any,
          payload: { text: 'invalid entry' },
        };
        await core.createEntry(invalidTypeEntry);
        // If we reach here, the validation didn't work
        throw new Error('createEntry should have failed for invalid entry type');
      } catch (e: any) {
        // Check if it's a ValidationError in various ways
        if (e.name === 'ValidationError' || 
            e.message.includes('ValidationError') || 
            e.message.includes('Invalid entry type') ||
            e instanceof Error && e.message.includes('Invalid entry type')) {
          validationErrorCaught = true;
        } else if (e.message) {
          // If it's some other error, re-throw it
          throw new Error(`Unexpected error: ${e.message}`);
        } else {
          // If it's not an error we recognize, re-throw it
          throw e;
        }
      }

      if (!validationErrorCaught) {
        throw new Error('createEntry should throw ValidationError for invalid entry type');
      }

      addTestResult('✅ Entries: validation works');
    } catch (error: any) {
      addTestResult(`❌ Entries: validation works - ${error.message}`);
    }
  };

  const testArchiveExport = async () => {
    try {
      await core.exportArchive(exportPath);
      const fileInfo = await FileSystem.getInfoAsync(exportPath);
      if (!fileInfo.exists) {
        throw new Error('Export file not found');
      }
      addTestResult('✅ Archive: can be exported');
    } catch (error: any) {
      addTestResult(`❌ Archive: can be exported - ${error.message}`);
    }
  };

  const testArchiveImport = async () => {
    try {
      // Add a temporary entry to make the live DB different from the backup
      await core.createEntry({
        type: 'text' as const,
        payload: { text: 'temporary' },
      });

      // Import the archive, which should overwrite the live DB
      await core.importArchive(exportPath);

      addTestResult('✅ Archive: can be imported');
    } catch (error: any) {
      addTestResult(`❌ Archive: can be imported - ${error.message}`);
    }
  };

  const testAllEntryTypes = async () => {
    try {
      // Test all entry types
      const entryTypes: ('text' | 'markdown' | 'metrics' | 'media_ref' | 'event' | 'log')[] = [
        'text',
        'markdown',
        'metrics',
        'media_ref',
        'event',
        'log',
      ];

      for (const entryType of entryTypes) {
        let payload: any;
        switch (entryType) {
          case 'text':
            payload = { text: 'sample text' };
            break;
          case 'markdown':
            payload = { markdown: '# Header\n\nContent' };
            break;
          case 'metrics':
            payload = { steps: 1000, calories: 50 };
            break;
          case 'media_ref':
            payload = { ref: 'abc123', type: 'image' };
            break;
          case 'event':
            payload = { title: 'Meeting', start: '2023-01-01T10:00:00Z' };
            break;
          case 'log':
            payload = { source: 'app', message: 'App started', level: 'info' };
            break;
        }

        const entry = {
          type: entryType,
          payload,
        };

        const createdEntry = await core.createEntry(entry);
        if (createdEntry.type !== entryType) {
          throw new Error(`Created entry type mismatch: got ${createdEntry.type}, want ${entryType}`);
        }
      }

      addTestResult('✅ All Entry Types: can be created');
    } catch (error: any) {
      addTestResult(`❌ All Entry Types: can be created - ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    await testProfileCreate();
    await testProfileUnlockAndLock();
    await testEntryCreate();
    await testEntryRetrieve();
    await testEntryQuery();
    await testEntryValidation();
    await testArchiveExport();
    await testArchiveImport();
    await testAllEntryTypes();
    
    // Lock at the end
    try {
      await core.lock();
      setIsUnlocked(false);
      addTestResult('✅ Profile: can be locked');
    } catch (error: any) {
      addTestResult(`❌ Profile: can be locked - ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>LogWayss Android Client - Smoke Tests</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Run All Tests" onPress={runAllTests} />
        <Button title="Clear Results" onPress={clearResults} color="#ff6b6b" />
      </View>
      
      <View style={styles.testContainer}>
        <Text style={styles.sectionTitle}>Individual Tests</Text>
        <Button title="Test Profile Create" onPress={testProfileCreate} />
        <Button title="Test Profile Unlock/Lock" onPress={testProfileUnlockAndLock} />
        <Button title="Test Entry Create" onPress={testEntryCreate} />
        <Button title="Test Entry Retrieve" onPress={testEntryRetrieve} />
        <Button title="Test Entry Query" onPress={testEntryQuery} />
        <Button title="Test Entry Validation" onPress={testEntryValidation} />
        <Button title="Test Archive Export" onPress={testArchiveExport} />
        <Button title="Test Archive Import" onPress={testArchiveImport} />
        <Button title="Test All Entry Types" onPress={testAllEntryTypes} />
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
      
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  testContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 14,
    marginVertical: 2,
  },
});
