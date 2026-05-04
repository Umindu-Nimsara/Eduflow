import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  StyleSheet, Alert, RefreshControl, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { formatFileSize } from "../../utils/fileUpload";

const PRIMARY = "#6C63FF";

const ManageLessonsScreen = ({ route, navigation }) => {
  const { courseId, courseTitle } = route.params || {};
  const [lessons,    setLessons]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState([]);

  useEffect(() => {
    console.log('ManageLessonsScreen mounted with courseId:', courseId);
    fetchLessons();
    // Refresh when coming back from AddLesson/EditLesson
    const unsubscribe = navigation.addListener("focus", () => {
      console.log('Screen focused, refreshing lessons...');
      fetchLessons();
    });
    return unsubscribe;
  }, [navigation, courseId]);
  
  // Remove the params refresh useEffect since it's causing navigation errors
  // The focus listener will handle refreshing

  const fetchLessons = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      console.log('=== FETCHING LESSONS ===');
      console.log('courseId:', courseId);
      
      // Add timestamp to bypass cache
      const timestamp = new Date().getTime();
      const url = `${ENDPOINTS.COURSES}/${courseId}/lessons?_t=${timestamp}`;
      console.log('Fetching from URL:', url);
      
      const res = await api.get(url);
      console.log('Response status:', res.status);
      console.log('Response data:', JSON.stringify(res.data, null, 2));
      
      const data = (res.data.data || []).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      console.log('Lessons count:', data.length);
      console.log('Lessons:', data.map(l => ({ id: l._id, title: l.title, module: l.module, courseId: l.courseId })));
      
      setLessons(data);
      setError(null);
    } catch (err) {
      console.error('Fetch lessons error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || "Failed to load lessons");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Group lessons by module
  const groupedLessons = lessons.reduce((acc, lesson) => {
    const moduleName = lesson.module || 'No Module';
    if (!acc[moduleName]) {
      acc[moduleName] = [];
    }
    acc[moduleName].push(lesson);
    return acc;
  }, {});

  const modules = Object.keys(groupedLessons).sort((a, b) => {
    // "No Module" always goes last
    if (a === 'No Module') return 1;
    if (b === 'No Module') return -1;
    return a.localeCompare(b);
  });

  const handleDelete = (lessonId, title) => {
    Alert.alert("Delete Lesson", `Delete "${title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`${ENDPOINTS.LESSONS}/${lessonId}`);
            setLessons(prev => prev.filter(l => l._id !== lessonId));
          } catch (err) {
            Alert.alert("Error", "Failed to delete lesson");
          }
        },
      },
    ]);
  };

  const toggleSelection = (lessonId) => {
    setSelectedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const selectAll = () => {
    setSelectedLessons(lessons.map(l => l._id));
  };

  const deselectAll = () => {
    setSelectedLessons([]);
  };

  const deleteSelected = () => {
    Alert.alert(
      "Delete Lessons",
      `Delete ${selectedLessons.length} lesson(s)? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                selectedLessons.map(id => api.delete(`${ENDPOINTS.LESSONS}/${id}`))
              );
              setLessons(prev => prev.filter(l => !selectedLessons.includes(l._id)));
              setSelectedLessons([]);
              setSelectionMode(false);
              Alert.alert("Success", `${selectedLessons.length} lesson(s) deleted`);
            } catch (err) {
              Alert.alert("Error", "Failed to delete some lessons");
            }
          },
        },
      ]
    );
  };

  const moveLesson = async (lesson, direction) => {
    const idx = lessons.findIndex(l => l._id === lesson._id);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= lessons.length) return;

    const newLessons = [...lessons];
    [newLessons[idx], newLessons[newIdx]] = [newLessons[newIdx], newLessons[idx]];
    setLessons(newLessons);

    // Update orderIndex on backend
    try {
      await Promise.all([
        api.put(`${ENDPOINTS.LESSONS}/${newLessons[idx]._id}`, { orderIndex: idx }),
        api.put(`${ENDPOINTS.LESSONS}/${newLessons[newIdx]._id}`, { orderIndex: newIdx }),
      ]);
    } catch (err) {
      console.error("Reorder failed:", err);
    }
  };

  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const videoCount   = lessons.filter(l => l.videoUrl).length;
  const pdfCount     = lessons.filter(l => l.pdfUrl && !l.videoUrl).length;

  const renderLesson = ({ item, index }) => {
    const isVideo = !!item.videoUrl;
    const isPdf   = !!item.pdfUrl && !item.videoUrl;
    const isSelected = selectedLessons.includes(item._id);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => selectionMode && toggleSelection(item._id)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(item._id);
          }
        }}
        activeOpacity={selectionMode ? 0.7 : 1}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <View style={styles.checkbox}>
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={24} 
              color={isSelected ? PRIMARY : "#ccc"} 
            />
          </View>
        )}

        {/* Order badge */}
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{String(index + 1).padStart(2, "0")}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
          {item.module && (
            <View style={styles.moduleBadge}>
              <Ionicons name="folder-outline" size={12} color={PRIMARY} />
              <Text style={styles.moduleText}>{item.module}</Text>
            </View>
          )}
          <View style={styles.badgeRow}>
            {isVideo && (
              <View style={[styles.typeBadge, { backgroundColor: "#3B82F620" }]}>
                <Text style={[styles.typeBadgeText, { color: "#3B82F6" }]}>🎬 Video</Text>
              </View>
            )}
            {isPdf && (
              <View style={[styles.typeBadge, { backgroundColor: "#EF444420" }]}>
                <Text style={[styles.typeBadgeText, { color: "#EF4444" }]}>📄 PDF</Text>
              </View>
            )}
            {!isVideo && !isPdf && (
              <View style={[styles.typeBadge, { backgroundColor: "#88888820" }]}>
                <Text style={[styles.typeBadgeText, { color: "#888" }]}>📝 Text</Text>
              </View>
            )}
          </View>
          {item.duration > 0 && (
            <Text style={styles.lessonMeta}>{item.duration} min</Text>
          )}
        </View>

        {/* Actions */}
        {!selectionMode && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => moveLesson(item, "up")}
              disabled={index === 0}
            >
              <Ionicons name="chevron-up" size={18} color={index === 0 ? "#ddd" : "#888"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => moveLesson(item, "down")}
              disabled={index === lessons.length - 1}
            >
              <Ionicons name="chevron-down" size={18} color={index === lessons.length - 1 ? "#ddd" : "#888"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("EditLesson", { lessonId: item._id, courseId })}
            >
              <Ionicons name="create-outline" size={18} color="#FFB347" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDelete(item._id, item.title)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderModuleSection = (moduleName) => {
    const moduleLessons = groupedLessons[moduleName];
    return (
      <View key={moduleName} style={styles.moduleSection}>
        <View style={styles.moduleHeader}>
          <Ionicons name="folder" size={20} color={PRIMARY} />
          <Text style={styles.moduleTitle}>{moduleName}</Text>
          <View style={styles.moduleCount}>
            <Text style={styles.moduleCountText}>{moduleLessons.length}</Text>
          </View>
        </View>
        {moduleLessons.map((lesson, index) => (
          <View key={lesson._id}>
            {renderLesson({ item: lesson, index: lessons.indexOf(lesson) })}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading lessons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Course header */}
      <View style={styles.header}>
        {selectionMode ? (
          <>
            <View style={styles.headerLeft}>
              <Text style={styles.courseTitle}>{selectedLessons.length} Selected</Text>
              <TouchableOpacity onPress={selectAll}>
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectionBtn}
                onPress={deleteSelected}
                disabled={selectedLessons.length === 0}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectionBtn, { marginLeft: 8 }]}
                onPress={() => {
                  setSelectionMode(false);
                  deselectAll();
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <Text style={styles.courseTitle} numberOfLines={1}>{courseTitle || "Course"}</Text>
              <Text style={styles.courseMeta}>
                {lessons.length} Lesson{lessons.length !== 1 ? "s" : ""} · {totalMinutes} total min
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("AddLesson", { courseId, lessonCount: lessons.length })}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add Lesson</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchLessons(true)} colors={[PRIMARY]} />
        }
      >
        {lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="play-circle-outline" size={72} color="#ddd" />
            <Text style={styles.emptyTitle}>No lessons yet</Text>
            <Text style={styles.emptySub}>Add your first lesson to get started</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate("AddLesson", { courseId, lessonCount: 0 })}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Add First Lesson</Text>
            </TouchableOpacity>
          </View>
        ) : (
          modules.map(moduleName => renderModuleSection(moduleName))
        )}
      </ScrollView>

      {/* Stats bar */}
      {lessons.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            🎬 {videoCount} Videos · 📄 {pdfCount} PDFs · {lessons.length} Total
          </Text>
        </View>
      )}

      {/* FAB */}
      {lessons.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddLesson", { courseId, lessonCount: lessons.length })}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#F5F5F5" },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#888" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  headerLeft:  { flex: 1, marginRight: 12 },
  courseTitle: { fontSize: 17, fontWeight: "bold", color: "#1a1a2e" },
  courseMeta:  { fontSize: 12, color: "#888", marginTop: 2 },
  addBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: "600", color: "#fff", marginLeft: 4 },
  selectionActions: { flexDirection: "row", alignItems: "center" },
  selectionBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: "#888" },
  selectAllText: { fontSize: 12, color: PRIMARY, marginTop: 2, fontWeight: "600" },
  list:        { padding: 16 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 12, padding: 14, marginBottom: 10,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardSelected: {
    backgroundColor: PRIMARY + "10",
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  checkbox: {
    marginRight: 8,
  },
  orderBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: PRIMARY + "20", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  orderText:    { fontSize: 13, fontWeight: "bold", color: PRIMARY },
  cardContent:  { flex: 1 },
  lessonTitle:  { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  moduleBadge:  { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  moduleText:   { fontSize: 11, color: PRIMARY, marginLeft: 4, fontWeight: "600" },
  badgeRow:     { flexDirection: "row", marginBottom: 4 },
  typeBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  lessonMeta:   { fontSize: 12, color: "#888" },
  actions:      { flexDirection: "column", alignItems: "center" },
  actionBtn:    { padding: 6 },
  moduleSection: { marginBottom: 20 },
  moduleHeader: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY + "10", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, marginBottom: 10,
  },
  moduleTitle: { fontSize: 15, fontWeight: "700", color: PRIMARY, marginLeft: 8, flex: 1 },
  moduleCount: {
    backgroundColor: PRIMARY, width: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  moduleCountText: { fontSize: 11, fontWeight: "bold", color: "#fff" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyTitle:   { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginTop: 16, marginBottom: 8 },
  emptySub:     { fontSize: 14, color: "#888", marginBottom: 24 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "600", color: "#fff", marginLeft: 6 },
  statsBar: {
    backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: "#eee", alignItems: "center",
  },
  statsText: { fontSize: 13, color: "#888", fontWeight: "500" },
  fab: {
    position: "absolute", bottom: 70, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PRIMARY, justifyContent: "center", alignItems: "center",
    elevation: 6, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
});

export default ManageLessonsScreen;
