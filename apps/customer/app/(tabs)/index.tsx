import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { useStore } from "@/store/useStore";
import { formatCurrency, formatDistance } from "@/utils/format";
import { Barber } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_PADDING = 20;
const BANNER_WIDTH = SCREEN_WIDTH - (BANNER_PADDING * 2);

export default function HomeScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const userPoints = useStore((state) => state.userPoints);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "online">("all");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const bannerRef = useRef<FlatList>(null);

  const { data: barbersResponse, isLoading } = useQuery({
    queryKey: ["barbers", selectedFilter],
    queryFn: () =>
      api.getBarbers({
        isOnline: selectedFilter === "online" ? true : undefined,
      }),
  });

  const barbers = barbersResponse?.data?.data || [];

  const filteredBarbers = searchQuery
    ? barbers.filter(
        (barber) =>
          barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          barber.specializations.some((s) =>
            s.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : barbers;

  // Promotional banners
  const banners = [
    {
      id: "1",
      image: require("@/assets/banner1.png"),
    },
    {
      id: "2",
      image: require("@/assets/banner2.png"),
    },
    {
      id: "3",
      image: require("@/assets/banner3.png"),
    },
  ];

  // Auto-scroll carousel with pause functionality
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => {
        const nextIndex = (prev + 1) % banners.length;
        bannerRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000); // Change banner every 3 seconds

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  // Handle user touch start - pause auto-scroll
  const handleBannerTouchStart = () => {
    setIsPaused(true);
  };

  // Handle user touch end - resume auto-scroll
  const handleBannerTouchEnd = () => {
    setIsPaused(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.screen}>
        {/* Header: 1/5 */}
        <View style={styles.heroSection}>
          {/* Top bar: Profile + Points */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.profileRow} activeOpacity={0.9}>
              <Image 
                source={{ uri: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }} 
                style={styles.profilePhoto} 
              />
              <View>
                <Text style={styles.greeting}>Good day,</Text>
                <Text style={styles.profileName}>{currentUser?.name || 'Guest'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pointsPill} activeOpacity={0.9}>
              <Ionicons name="star" size={18} color="#FFA500" />
              <Text style={styles.pointsText}>{userPoints.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner: 3/5 */}
        <View style={styles.carouselSection}>
          <FlatList
            ref={bannerRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 0 }}
            onScrollBeginDrag={handleBannerTouchStart}
            onTouchStart={handleBannerTouchStart}
            onTouchEnd={handleBannerTouchEnd}
            onScrollEndDrag={handleBannerTouchEnd}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setCurrentBannerIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, paddingHorizontal: BANNER_PADDING }}>
                <TouchableOpacity style={styles.bannerCard} activeOpacity={0.95}>
                  <Image
                    source={item.image}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />

          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentBannerIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Buttons: 1/5 */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.9}
              onPress={() => router.push('/barbers')}
            >
              <Ionicons name="person-outline" size={22} color="#00B14F" />
              <Text style={styles.actionLabel}>Freelance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.9}
              onPress={() => router.push('/barbershops')}
            >
              <Ionicons name="business-outline" size={22} color="#00B14F" />
              <Text style={styles.actionLabel}>Barbershop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function BarberCard({ barber }: { barber: Barber }) {
  return (
    <TouchableOpacity
      style={styles.barberCard}
      onPress={() => router.push(`/barber/${barber.id}` as any)}
      activeOpacity={0.95}
    >
      {/* Image with Badge Overlay */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: barber.avatar }} style={styles.barberImage} />
        {barber.isOnline && (
          <View style={styles.liveBadge}>
            <View style={styles.livePulse} />
            <Text style={styles.liveText}>AVAILABLE</Text>
          </View>
        )}
        {barber.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Name & Rating */}
        <View style={styles.titleRow}>
          <Text style={styles.barberName} numberOfLines={1}>
            {barber.name}
          </Text>
          <View style={styles.ratingPill}>
            <Text style={styles.starEmoji}>⭐</Text>
            <Text style={styles.ratingValue}>{barber.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {barber.specializations.slice(0, 3).map((spec) => (
            <View key={spec} style={styles.tag}>
              <Text style={styles.tagText}>{spec}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>{barber.completedJobs} jobs</Text>
            <View style={styles.dot} />
            <Text style={styles.statsText}>{barber.totalReviews} reviews</Text>
          </View>
        </View>

        {/* Price Badge - Grab Style */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceValue}>
            {formatCurrency(barber.services[0]?.price || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  screen: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: "#00B14F",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    minHeight: 50,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    color: '#065F46',
    fontSize: 15,
    fontWeight: '700',
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  searchEmoji: {
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  carouselSection: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: '100%',
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 3,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: "#00B14F",
  },
  actionsSection: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 100,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  filterSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  filterPillActive: {
    backgroundColor: "#00B14F",
    borderColor: "#00B14F",
  },
  filterText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00B14F",
    marginRight: 8,
  },
  barbersSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  barberHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  barberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  barberImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  liveBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#00B14F",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 6,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  barberName: {
    flex: 1,
    fontSize: 19,
    fontWeight: "bold",
    color: "#111827",
    marginRight: 12,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  starEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#92400E",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 8,
  },
  priceBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#00B14F",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginRight: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
