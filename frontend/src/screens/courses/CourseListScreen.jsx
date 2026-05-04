import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatCoursePrice } from '../../utils/priceFormatter';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courseService } from '../../services/courseService';
import CourseCard from '../../components/common/CourseCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';

const PRIMARY = '#6C63FF';

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADES = ['All', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];

const CATEGORIES = [
  'All',
  'Sinhala',
  'Tamil',
  'English',
  'Mathematics',
  'Science',
  'History',
  'Geography',
  'Civic Education',
  'Buddhism',
  'Christianity',
  'Hinduism',
  'Islam',
  'Health & Physical Education',
  'ICT',
  'Art',
  'Music',
  'Dancing',
  'Drama',
];

const SORT_OPTIONS = [
  { label: 'Newest First',       value: 'newest' },
  { label: 'Oldest First',       value: 'oldest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular',       value: 'popular' },
];

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.card, { opacity: anim, flexDirection: 'row', minHeight: 100 }]}>
      <View style={{ width: 90, backgroundColor: '#E0E0E0' }} />
      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
        <View style={{ height: 14, backgroundColor: '#E0E0E0', borderRadius: 6, width: '85%' }} />
        <View style={{ height: 11, backgroundColor: '#E0E0E0', borderRadius: 6, width: '55%' }} />
        <View style={{ height: 11, backgroundColor: '#E0E0E0', borderRadius: 6, width: '40%' }} />
      </View>
    </Animated.View>
  );
};

// ── Featured card ─────────────────────────────────────────────────────────────
const FeaturedCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.85}>
    {item.thumbnail ? (
      <Image source={{ uri: item.thumbnail }} style={styles.featuredThumb} resizeMode="cover" />
    ) : (
      <View style={[styles.featuredThumb, styles.thumbPlaceholder]}>
        <Ionicons name="book" size={36} color="#fff" />
      </View>
    )}
    {/* Featured badge */}
    <View style={styles.featuredBadge}>
      <Text style={styles.featuredBadgeText}>Featured</Text>
    </View>
    <View style={styles.featuredInfo}>
      <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.featuredPrice}>
        {formatCoursePrice(item)}
      </Text>
    </View>
  </TouchableOpacity>
);

// ── Main screen ───────────────────────────────────────────────────────────────
const CourseListScreen = ({ navigation }) => {
  const [courses,        setCourses]        = useState([]);
  const [featured,       setFeatured]       = useState([]);
  const [catCounts,      setCatCounts]      = useState({});
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeGrade,    setActiveGrade]    = useState('All');
  const [sortBy,         setSortBy]         = useState('newest');
  const [sortModal,      setSortModal]      = useState(false);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(true);
  const [total,          setTotal]          = useState(0);

  const searchTimer = useRef(null);
  const isFiltering = search.trim() !== '' || activeCategory !== 'All' || activeGrade !== 'All';

  // ── Sort helper ──────────────────────────────────────────────────────────
  const sortList = (list, sort) => {
    const arr = [...list];
    switch (sort) {
      case 'oldest':     return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'price_asc':  return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc': return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'popular':    return arr.sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0));
      default:           return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCourses = useCallback(async ({
    pageNum   = 1,
    searchVal = search,
    category  = activeCategory,
    grade     = activeGrade,
    sort      = sortBy,
    append    = false,
  } = {}) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      else setLoadingMore(true);

      const cat = category === 'All' ? '' : category;
      const res = await courseService.getAllCourses(pageNum, 10, searchVal, cat);
      let data = res.data || [];
      
      // Filter by grade if selected
      if (grade !== 'All') {
        data = data.filter(course => course.title.includes(grade));
      }
      
      data = sortList(data, sort);

      if (pageNum === 1) {
        setCourses(data);
        // Build category counts from first page (all courses, no filter)
        if (!searchVal && category === 'All' && grade === 'All') {
          setFeatured(data.slice(0, 5));
          buildCatCounts(data);
        }
      } else {
        setCourses(prev => [...prev, ...data]);
      }

      setTotal(data.length);
      setHasMore(false); // Disable pagination for now since we're filtering client-side
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [search, activeCategory, activeGrade, sortBy]);

  // Build category counts from loaded courses
  const buildCatCounts = (list) => {
    const counts = {};
    list.forEach(c => {
      if (c.category) counts[c.category] = (counts[c.category] || 0) + 1;
    });
    setCatCounts(counts);
  };

  useEffect(() => { fetchCourses(); }, []);

  // ── Debounced search ─────────────────────────────────────────────────────
  const handleSearchChange = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchCourses({ pageNum: 1, searchVal: text });
    }, 500);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    fetchCourses({ pageNum: 1, searchVal: '' });
  };

  // ── Category ─────────────────────────────────────────────────────────────
  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setPage(1);
    fetchCourses({ pageNum: 1, category: cat });
  };

  // ── Grade ────────────────────────────────────────────────────────────────
  const handleGrade = (grade) => {
    setActiveGrade(grade);
    setPage(1);
    fetchCourses({ pageNum: 1, grade });
  };

  // ── Sort ─────────────────────────────────────────────────────────────────
  const handleSort = (val) => {
    setSortBy(val);
    setSortModal(false);
    setCourses(prev => sortList(prev, val));
  };

  // ── Refresh ──────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchCourses({ pageNum: 1 });
  };

  // ── Load more ────────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchCourses({ pageNum: next, append: true });
    }
  };

  // ── Clear all filters ────────────────────────────────────────────────────
  const clearAll = () => {
    setSearch('');
    setActiveCategory('All');
    setActiveGrade('All');
    setPage(1);
    fetchCourses({ pageNum: 1, searchVal: '', category: 'All', grade: 'All' });
  };

  // ── List header ──────────────────────────────────────────────────────────
  const ListHeader = () => (
    <>
      {/* Featured section - only when not filtering */}
      {!isFiltering && featured.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Courses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featured.map(item => (
              <FeaturedCard
                key={item._id}
                item={item}
                onPress={() => navigation.navigate('CourseDetail', { courseId: item._id })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Result count + sort */}
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>
          {total} Course{total !== 1 ? 's' : ''}
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
        </Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModal(true)}>
          <Ionicons name="funnel-outline" size={14} color={PRIMARY} />
          <Text style={styles.sortBtnText}>
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={PRIMARY} />
        </TouchableOpacity>
      </View>
    </>
  );

  // ── Skeleton loading ─────────────────────────────────────────────────────
  if (loading && courses.length === 0) {
    return (
      <View style={styles.container}>
        <SearchBar
          search={search}
          onChange={handleSearchChange}
          onClear={clearSearch}
        />
        <CategoryBar
          categories={CATEGORIES}
          active={activeCategory}
          counts={catCounts}
          onSelect={handleCategory}
        />
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  if (error && courses.length === 0) {
    return <ErrorView message={error} onRetry={() => fetchCourses()} />;
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <SearchBar
        search={search}
        onChange={handleSearchChange}
        onClear={clearSearch}
      />

      {/* Grade selector */}
      <GradeBar
        grades={GRADES}
        active={activeGrade}
        onSelect={handleGrade}
      />

      {/* Category pills */}
      <CategoryBar
        categories={CATEGORIES}
        active={activeCategory}
        counts={catCounts}
        onSelect={handleCategory}
      />

      {/* Course list */}
      <FlatList
        data={courses}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item._id })}
          />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[PRIMARY]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="search-outline"
              title={search ? `No results for "${search}"` : 'No courses found'}
              description={isFiltering ? 'Try different keywords or clear filters' : 'Check back later for new courses'}
              actionLabel={isFiltering ? 'Clear Filters' : ''}
              onAction={isFiltering ? clearAll : null}
            />
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
      />

      {/* Sort modal */}
      <Modal
        visible={sortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sort By</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={styles.modalOption}
                onPress={() => handleSort(opt.value)}
              >
                <Text style={[styles.modalOptionText, sortBy === opt.value && styles.modalOptionActive]}>
                  {opt.label}
                </Text>
                {sortBy === opt.value && (
                  <Ionicons name="checkmark" size={18} color={PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => setSortModal(false)}
            >
              <Text style={styles.modalApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SearchBar = ({ search, onChange, onClear }) => (
  <View style={styles.searchBar}>
    <View style={styles.searchBox}>
      <Ionicons name="search" size={18} color="#888" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search courses..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={onChange}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={18} color="#aaa" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const CategoryBar = ({ categories, active, counts, onSelect }) => (
  <View style={styles.categoryBar}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
      {categories.map(cat => {
        const count = cat === 'All' ? null : counts[cat];
        const isActive = active === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(cat)}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {cat}{count ? ` (${count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

// ── Grade Bar ─────────────────────────────────────────────────────────────────
const GradeBar = ({ grades, active, onSelect }) => (
  <View style={styles.gradeBar}>
    <Text style={styles.gradeLabel}>Grade:</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeScroll}>
      {grades.map(grade => {
        const isActive = active === grade;
        return (
          <TouchableOpacity
            key={grade}
            style={[styles.gradePill, isActive && styles.gradePillActive]}
            onPress={() => onSelect(grade)}
          >
            <Text style={[styles.gradePillText, isActive && styles.gradePillTextActive]}>
              {grade}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Search
  searchBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1a1a2e',
  },

  // Category
  categoryBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  pillText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Grade
  gradeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gradeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  gradeScroll: {
    paddingRight: 12,
  },
  gradePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  gradePillActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  gradePillText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  gradePillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: 16,
    paddingTop: 8,
  },

  // Result row
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY + '40',
  },
  sortBtnText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
    marginHorizontal: 4,
  },

  // Featured
  featuredSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  featuredCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  featuredThumb: {
    width: '100%',
    height: 110,
    backgroundColor: '#E8E8F0',
  },
  thumbPlaceholder: {
    backgroundColor: PRIMARY + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  featuredInfo: {
    padding: 10,
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PRIMARY,
  },

  // Card (used by skeleton)
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  // Sort modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#1a1a2e',
  },
  modalOptionActive: {
    color: PRIMARY,
    fontWeight: '600',
  },
  modalApplyBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  modalApplyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CourseListScreen;
