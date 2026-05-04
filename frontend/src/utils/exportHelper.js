import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportToCSV = async (data, filename) => {
  try {
    if (!data || data.length === 0) {
      Alert.alert('No Data', 'There is no data to export');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvContent += values.join(',') + '\n';
    });

    // Save to file
    const fileUri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Success', `File saved to ${fileUri}`);
    }
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert('Export Failed', 'Could not export data');
  }
};

export const formatStudentDataForExport = (students) => {
  return students.map(student => ({
    Name: student.userId?.name || 'Unknown',
    Email: student.userId?.email || '',
    Progress: `${student.progress || 0}%`,
    'Enrolled Date': student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : '',
    Status: student.progress >= 80 ? 'Excellent' : student.progress >= 50 ? 'Good' : 'Needs Help',
  }));
};

export const formatSubmissionsForExport = (submissions) => {
  return submissions.map(sub => ({
    Student: sub.userId?.name || 'Unknown',
    Email: sub.userId?.email || '',
    'Submitted At': sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '',
    Grade: sub.grade !== undefined ? sub.grade : 'Not Graded',
    Status: sub.isGraded ? 'Graded' : 'Pending',
    Feedback: sub.feedback || 'No feedback',
  }));
};
