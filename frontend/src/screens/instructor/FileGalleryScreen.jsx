import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, RefreshControl, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';

const PRIMARY = '#6C63FF';

const FileGalleryScreen = ({ navigation }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, image, video, pdf
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [filter]);

  const fetchFiles = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const filterParams = filter !== 'all' ? { type: filter } : {};
      const params = new URLSearchParams(filterParams).toString();
      const response = await api.get(`/files?${params}`);
      setFiles(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (file) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete this ${file.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/files/${file._id}`);
              setFiles(prev => prev.filter(f => f._id !== file._id));
              Alert.alert('Success', 'File deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const handlePreview = (file) => {
    setSelectedFile(file);
    setPreviewVisible(true);
  };

  const renderFile = ({ item }) => {
    const isImage = item.type === 'image';
    const isVideo = item.type === 'video';
    const isPdf = item.type === 'pdf';

    return (
      <TouchableOpacity
        style={styles.fileCard}
        onPress={() => handlePreview(item)}
        activeOpacity={0.8}
      >
        {isImage && (
          <Image source={{ uri: item.url }} style={styles.thumbnail} resizeMode="cover" />
        )}
        {isVideo && (
          <View style={[styles.thumbnail, styles.videoThumb]}>
            <Ionicons name="play-circle" size={48} color="#fff" />
          </View>
        )}
        {isPdf && (
          <View style={[styles.thumbnail, styles.pdfThumb]}>
            <Ionicons name="document-text" size={48} color="#fff" />
          </View>
        )}

        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.originalFilename || 'Untitled'}
          </Text>
          <View style={styles.fileMeta}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
              <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
            </View>
            {item.size && (
              <Text style={styles.fileSize}>{formatBytes(item.size)}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFilter = (type, label, icon) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === type && styles.filterBtnActive]}
      onPress={() => setFilter(type)}
    >
      <Ionicons
        name={icon}
        size={20}
        color={filter === type ? '#fff' : PRIMARY}
      />
      <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner text="Loading files..." />;
  if (error) return <ErrorView message={error} onRetry={fetchFiles} />;

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {renderFilter('all', 'All', 'grid-outline')}
        {renderFilter('image', 'Images', 'image-outline')}
        {renderFilter('video', 'Videos', 'videocam-outline')}
        {renderFilter('pdf', 'PDFs', 'document-text-outline')}
      </View>

      {/* File Grid */}
      <FlatList
        data={files}
        keyExtractor={item => item._id}
        renderItem={renderFile}
        numColumns={2}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFiles(true)}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cloud-upload-outline"
            title="No files yet"
            description="Upload images, videos, or PDFs to see them here"
          />
        }
      />

      {/* Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>

            {selectedFile && (
              <>
                {selectedFile.type === 'image' && (
                  <Image
                    source={{ uri: selectedFile.url }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                )}
                {selectedFile.type === 'video' && (
                  <View style={styles.previewPlaceholder}>
                    <Ionicons name="videocam" size={64} color="#fff" />
                    <Text style={styles.previewText}>Video Preview</Text>
                    <Text style={styles.previewUrl}>{selectedFile.url}</Text>
                  </View>
                )}
                {selectedFile.type === 'pdf' && (
                  <View style={styles.previewPlaceholder}>
                    <Ionicons name="document-text" size={64} color="#fff" />
                    <Text style={styles.previewText}>PDF Document</Text>
                    <Text style={styles.previewUrl}>{selectedFile.url}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getTypeColor = (type) => {
  switch (type) {
    case 'image': return '#43C678';
    case 'video': return '#FF6584';
    case 'pdf': return '#FFB347';
    default: return '#888';
  }
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PRIMARY,
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#fff',
  },
  grid: {
    padding: 8,
  },
  fileCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8E8F0',
  },
  videoThumb: {
    backgroundColor: PRIMARY + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfThumb: {
    backgroundColor: '#FFB347CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    padding: 10,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  fileSize: {
    fontSize: 11,
    color: '#888',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  previewUrl: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default FileGalleryScreen;
