import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { formatCurrency, formatDistance } from '@mari-gunting/shared/utils/format';
import { Barber } from "@/types";
import {
  SkeletonCircle,
  SkeletonText,
  SkeletonBase,
} from "@/components/Skeleton";
import { supabase } from "@mari-gunting/shared/config/supabase";
import { useLocation } from "@/hooks/useLocation";
import {
  batchCalculateDistances,
  formatDuration,
} from "@mari-gunting/shared/utils/directions";
import { ENV } from "@mari-gunting/shared/config/env";
import { useFocusEffect } from "@react-navigation/native";
import { useStore } from "@/store/useStore";
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function BarbersScreen() {
  const currentUser = useStore((state) => state.currentUser); // Get current user to filter out self
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(5);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "price-low" | "price-high">(
    "distance"
  );
  const [showSortModal, setShowSortModal] = useState(false);
  const [calculatingDistances, setCalculatingDistances] = useState(false);
  const queryClient = useQueryClient();
  const { location, getCurrentLocation, hasPermission, requestPermission } = useLocation();
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefetchTimestampRef = useRef<number>(0);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const isScreenActiveRef = useRef<boolean>(true);

  // Get user location on mount
  useEffect(() => {
    if (hasPermission) {
      getCurrentLocation();
    }
  }, [hasPermission, getCurrentLocation]);

  const {
    data: barbersResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["barbers", radius, location?.latitude, location?.longitude],
    queryFn: () =>
      api.getBarbers({
        isOnline: true,
        isAvailable: true,
        location: location
          ? {
              lat: location.latitude,
              lng: location.longitude,
              radius: radius,
            }
          : undefined,
      }),
    enabled: !!location, // Only fetch when location is available
    refetchOnMount: "always", // Always refetch on mount
    refetchOnWindowFocus: false, // Disable auto-refetch, use real-time updates instead
    staleTime: 0, // No cache
    cacheTime: 0, // Don't keep in cache
  });

  // Refetch when screen comes into focus (after viewing barber profile)
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Available Barbers screen focused - refreshing list");
      // AGGRESSIVE: Remove all cached barber data
      queryClient.removeQueries({ queryKey: ["barbers"] });
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      refetch();
    }, [refetch, queryClient])
  );

  // Local state for real-time updates (Grab's pattern)
  const [realtimeBarbers, setRealtimeBarbers] = useState<typeof rawBarbers>([]);

  // Sync realtime state with query data
  useEffect(() => {
    if (barbersResponse?.data?.data) {
      setRealtimeBarbers(barbersResponse.data.data);
    }
  }, [barbersResponse]);

  // Track screen visibility (Grab pattern: pause subscriptions when not visible)
  useFocusEffect(
    useCallback(() => {
      isScreenActiveRef.current = true;
      console.log('👁️  Screen is now active - real-time enabled');
      return () => {
        isScreenActiveRef.current = false;
        console.log('👁️  Screen is now inactive - real-time paused');
        // Clear any pending refetches
        if (refetchTimeoutRef.current) {
          clearTimeout(refetchTimeoutRef.current);
          refetchTimeoutRef.current = null;
        }
      };
    }, [])
  );

  // Real-time subscription for barber availability changes (Grab's pattern)
  useEffect(() => {
    if (!location) return; // Don't subscribe until we have location

    console.log("🔌 Setting up real-time subscriptions (Grab pattern)...");

    // Subscribe to profiles table changes (is_online)
    const profilesChannel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          // GRAB OPTIMIZATION: Ignore if screen not active
          if (!isScreenActiveRef.current) {
            console.log('⏸️  Ignoring real-time event - screen not active');
            return;
          }

          const affectedUserId = payload.new?.id; // This is profiles.id (user_id)
          const newOnline = payload.new?.is_online;
          const oldOnline = (payload.old as any)?.is_online;

          // GRAB OPTIMIZATION: Ignore initial sync and non-changes
          // oldOnline = undefined → initial subscription event, not a real change
          // oldOnline = newOnline → heartbeat update, not a real change
          if (oldOnline === undefined || oldOnline === newOnline) {
            return; // Skip: no meaningful change
          }

          // GRAB OPTIMIZATION: Deduplicate events (extra safety)
          const eventKey = `${affectedUserId}-${newOnline}`;
          if (processedEventsRef.current.has(eventKey)) {
            return;
          }
          processedEventsRef.current.add(eventKey);
          // Clear old events after 5 seconds (longer window for stability)
          setTimeout(() => processedEventsRef.current.delete(eventKey), 5000);

          console.log(
            `⚡ Real-time: User ${affectedUserId} online: ${oldOnline} → ${newOnline}`
          );

          // Update state directly (instant UI update!)
          setRealtimeBarbers((prev) => {
            if (!newOnline) {
              // Barber went offline - remove immediately by matching user_id
              const filtered = prev.filter((b) => b.userId !== affectedUserId);
              if (filtered.length !== prev.length) {
                console.log(
                  `👋 Removed offline barber (${prev.length} → ${filtered.length})`
                );
              }
              return filtered;
            } else {
              // Barber came online - only refetch if NOT already in list
              const alreadyInList = prev.some((b) => b.userId === affectedUserId);
              
              if (!alreadyInList) {
                // GRAB OPTIMIZATION: Rate limit refetches (max 1 per 2 seconds)
                const now = Date.now();
                const timeSinceLastRefetch = now - lastRefetchTimestampRef.current;
                if (timeSinceLastRefetch < 2000) {
                  console.log(`⏳ Skipping refetch - too soon (${timeSinceLastRefetch}ms ago)`);
                  return prev;
                }

                console.log("✅ Barber came online - scheduling refetch...");

                // Clear any pending refetch
                if (refetchTimeoutRef.current) {
                  clearTimeout(refetchTimeoutRef.current);
                }

                // Wait 500ms before refetching (debounce)
                refetchTimeoutRef.current = setTimeout(() => {
                  console.log("🔄 Executing debounced refetch...");
                  lastRefetchTimestampRef.current = Date.now();
                  refetch();
                }, 500);
              }
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log("📡 Profiles channel status:", status);
      });

    // Subscribe to barbers table changes (is_available)
    const barbersChannel = supabase
      .channel("barbers-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "barbers",
        },
        (payload) => {
          const affectedBarberId = payload.new?.id;
          const newAvailable = payload.new?.is_available;

          console.log(
            `⚡ Real-time: Barber ${affectedBarberId} available: ${newAvailable}`
          );

          // Update state directly (instant UI update!)
          setRealtimeBarbers((prev) => {
            if (!newAvailable) {
              // Barber became unavailable - remove immediately
              const filtered = prev.filter((b) => b.id !== affectedBarberId);
              console.log(
                `🚫 Removed unavailable barber (${prev.length} → ${filtered.length})`
              );
              return filtered;
            } else {
              // Barber became available - debounce refetch to avoid race conditions
              console.log("✅ Barber became available - scheduling refetch...");

              // Clear any pending refetch
              if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current);
              }

              // Wait 500ms before refetching (debounce)
              refetchTimeoutRef.current = setTimeout(() => {
                console.log("🔄 Executing debounced refetch...");
                refetch();
              }, 500);
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log("📡 Barbers channel status:", status);
      });

    // Subscribe to bookings table changes (active booking status changes)
    const bookingsChannel = supabase
      .channel("bookings-changes-barbers")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          const newStatus = payload.new?.status;
          const oldStatus = (payload.old as any)?.status;
          const barberId =
            payload.new?.barber_id || (payload.old as any)?.barber_id;

          // Active booking statuses that make a barber busy
          const activeStatuses = [
            "accepted",
            "on_the_way",
            "arrived",
            "in_progress",
          ];
          const wasActive = oldStatus && activeStatuses.includes(oldStatus);
          const isActive = newStatus && activeStatuses.includes(newStatus);

          // Refetch if booking status changed to/from active
          if (wasActive !== isActive) {
            console.log(
              `⚡ Booking status changed for barber ${barberId}: ${oldStatus} → ${newStatus}`
            );
            console.log("🔄 Refetching barbers list...");
            refetch();
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Bookings channel status:", status);
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log("🔌 Cleaning up subscriptions...");
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(barbersChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [refetch, location]); // Include refetch and location in dependencies

  // Periodic heartbeat check: Auto-remove barbers with stale heartbeat (>90s)
  useEffect(() => {
    if (realtimeBarbers.length === 0) {
      console.log('⏭️  Skipping heartbeat check - no barbers visible');
      return;
    }
    
    // Don't run checks while initial data is loading
    if (isLoading) {
      console.log('⏭️  Skipping heartbeat check - data is loading');
      return;
    }

    const checkStaleBarbers = async () => {
      const now = new Date();
      const ninetySecondsAgo = new Date(Date.now() - 90 * 1000); // 90 seconds (production standard)
      const userIds = realtimeBarbers.map((b) => b.userId).filter(Boolean);

      const malaysiaTime = now.toLocaleString('en-MY', { 
        timeZone: 'Asia/Kuala_Lumpur',
        hour12: false 
      });
      console.log(`🔍 [CUSTOMER] ${malaysiaTime} Heartbeat check running`);
      console.log(
        `    Checking ${userIds.length} barbers for stale heartbeat (>90s)...`
      );

      if (userIds.length === 0) {
        console.log("   ⚠️  No user IDs found in barbers");
        return;
      }

      // Fetch heartbeat data
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, full_name, last_heartbeat")
        .in("id", userIds);

      if (error) {
        console.error("   ❌ Error fetching heartbeat data:", error);
        return;
      }

      if (!profilesData) {
        console.log("   ⚠️  No profile data returned");
        return;
      }

      // Log each barber's heartbeat status
      profilesData.forEach((p) => {
        const lastHeartbeat = p.last_heartbeat
          ? new Date(p.last_heartbeat)
          : null;
        const secondsAgo = lastHeartbeat
          ? (now.getTime() - lastHeartbeat.getTime()) / 1000
          : null;
        console.log(
          `    👤 ${p.full_name || p.id}: ${
            lastHeartbeat ? `${secondsAgo?.toFixed(0)}s ago` : "NO HEARTBEAT"
          } ${secondsAgo && secondsAgo > 90 ? '❌ STALE' : '✅ FRESH'}`
        );
      });

      // Find stale barbers (no heartbeat or > 90 seconds old)
      const staleUserIds = new Set(
        profilesData
          .filter(
            (p) =>
              !p.last_heartbeat || new Date(p.last_heartbeat) < ninetySecondsAgo
          )
          .map((p) => p.id)
      );

      if (staleUserIds.size > 0) {
        console.log(
          `🔴 Auto-removing ${
            staleUserIds.size
          } barbers with stale heartbeat (${Array.from(staleUserIds).join(
            ", "
          )})`
        );
        setRealtimeBarbers((prev) => {
          const filtered = prev.filter((b) => !staleUserIds.has(b.userId));
          console.log(
            `👋 Removed stale barbers (${prev.length} → ${filtered.length})`
          );
          return filtered;
        });
      } else {
        console.log("   ✅ All barbers have fresh heartbeat");
      }
    };

    // Check immediately
    checkStaleBarbers();

    // Then check every 30 seconds
    const interval = setInterval(checkStaleBarbers, 30 * 1000);

    return () => clearInterval(interval);
  }, [realtimeBarbers]);

  // Use realtime barbers instead of query data directly
  const rawBarbers = realtimeBarbers;

  // State to store calculated driving distances and durations
  const [barberRoutesInfo, setBarberRoutesInfo] = useState<
    Map<string, { distanceKm: number; durationMinutes: number }>
  >(new Map());

  // GRAB STANDARD: Calculate REAL driving distances for ALL visible barbers (with smart caching)
  useEffect(() => {
    if (!location || rawBarbers.length === 0) return;

    const calculateDrivingDistances = async () => {
      setCalculatingDistances(true);

      try {
        console.log(
          `🗺️ Calculating real driving distances for ${rawBarbers.length} barbers`
        );

        // Calculate actual driving distances for ALL barbers (PostGIS already filtered by radius)
        const destinations = rawBarbers.map((b) => ({
          id: b.id,
          latitude: b.location.latitude,
          longitude: b.location.longitude,
        }));

        const routesMap = await batchCalculateDistances(
          location,
          destinations,
          ENV.MAPBOX_ACCESS_TOKEN || "",
          {
            useCache: true,
            supabase: supabase,
            cacheTTL: 3600, // 1 hour cache - high hit rate for repeated views
          }
        );

        console.log(`✅ Calculated ${routesMap.size} real driving distances`);
        setBarberRoutesInfo(routesMap);
      } catch (error) {
        console.error("❌ Error calculating driving distances:", error);
      } finally {
        setCalculatingDistances(false);
      }
    };

    calculateDrivingDistances();
  }, [rawBarbers, location, radius]);

  // Combine barbers with their driving distance info
  const barbers = useMemo(() => {
    return rawBarbers.map((barber) => {
      const routeInfo = barberRoutesInfo.get(barber.id);
      return {
        ...barber,
        distance: routeInfo?.distanceKm, // Real driving distance from Mapbox
        durationMinutes: routeInfo?.durationMinutes,
      };
    });
  }, [rawBarbers, barberRoutesInfo]);

  const filteredBarbers = barbers.filter((barber) => {
    const matchesSearch =
      !searchQuery ||
      barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.specializations.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Solution A: Filter by DRIVING distance (matches what customer selected!)
    // Customer's search radius: barber must be within customer's chosen DRIVING radius
    const withinCustomerRadius =
      barber.distance !== undefined && barber.distance <= radius;

    // Barber's service radius: customer must be within barber's service area (also driving distance)
    const withinBarberServiceArea =
      barber.distance !== undefined &&
      barber.distance <= barber.serviceRadiusKm;

    // GRAB-STYLE: Prevent self-booking (don't show user's own barber account)
    const isNotSelf = currentUser ? barber.userId !== currentUser.id : true;

    return (
      matchesSearch &&
      withinCustomerRadius &&
      withinBarberServiceArea &&
      barber.isOnline &&
      barber.isAvailable &&
      isNotSelf // Don't show your own barber account
    );
  });

  const sortedBarbers = [...filteredBarbers].sort((a, b) => {
    if (sortBy === "distance") {
      return (a.distance || 999) - (b.distance || 999);
    } else if (sortBy === "price-low") {
      const priceA = a.services[0]?.price || 999999;
      const priceB = b.services[0]?.price || 999999;
      return priceA - priceB;
    } else if (sortBy === "price-high") {
      const priceA = a.services[0]?.price || 0;
      const priceB = b.services[0]?.price || 0;
      return priceB - priceA;
    }
    return 0;
  });

  const getSortLabel = () => {
    switch (sortBy) {
      case "distance":
        return "Nearest first";
      case "price-low":
        return "Price: Low to High";
      case "price-high":
        return "Price: High to Low";
      default:
        return "Nearest first";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Barbers</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Location & Radius */}
      <View style={styles.locationSection}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.locationText}>Within {radius}km from you</Text>
        </View>
        <TouchableOpacity
          style={styles.radiusButton}
          onPress={() => setShowRadiusModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.radiusButtonText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultCount}>
          {sortedBarbers.length} available{" "}
          {sortedBarbers.length === 1 ? "barber" : "barbers"}
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={14} color={Colors.primary} />
          <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Barbers List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {calculatingDistances && (
          <View style={styles.calculatingBanner}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.calculatingText}>
              Calculating driving distances...
            </Text>
          </View>
        )}

        {!location ? (
          // Location Required State (Fallback safety net)
          <View style={styles.emptyState}>
            <View style={styles.locationRequiredIcon}>
              <Ionicons name="location-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Location Required</Text>
            <Text style={styles.emptyText}>
              Enable location to find nearby barbers within your chosen radius
            </Text>
            <TouchableOpacity
              style={styles.enableLocationButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={20} color={Colors.white} />
              <Text style={styles.enableLocationButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          // Skeleton Loading Cards
          <>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.card}>
                <View style={styles.cardInner}>
                  <SkeletonCircle size={72} />
                  <View style={styles.info}>
                    <View style={styles.topRow}>
                      <SkeletonText width="60%" height={15} />
                    </View>
                    <View style={styles.metaRow}>
                      <SkeletonBase
                        width={50}
                        height={13}
                        borderRadius={6}
                        style={{ marginTop: 6 }}
                      />
                    </View>
                    <View style={styles.distanceRow}>
                      <SkeletonBase
                        width={80}
                        height={13}
                        borderRadius={6}
                        style={{ marginTop: 6 }}
                      />
                    </View>
                    <View style={styles.bottom}>
                      <View>
                        <SkeletonText
                          width={40}
                          height={10}
                          style={{ marginBottom: 4 }}
                        />
                        <SkeletonText width={60} height={17} />
                      </View>
                      <SkeletonBase width={80} height={24} borderRadius={12} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : sortedBarbers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No barbers found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          sortedBarbers.map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))
        )}
      </ScrollView>

      {/* Sort Modal */}
      {showSortModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "distance" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("distance");
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    sortBy === "distance" && styles.radioCircleActive,
                  ]}
                >
                  {sortBy === "distance" && <View style={styles.radioInner} />}
                </View>
                <View style={styles.sortOptionContent}>
                  <Ionicons name="navigate" size={20} color={Colors.primary} />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === "distance" && styles.sortOptionTextActive,
                    ]}
                  >
                    Nearest first
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "price-low" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("price-low");
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    sortBy === "price-low" && styles.radioCircleActive,
                  ]}
                >
                  {sortBy === "price-low" && <View style={styles.radioInner} />}
                </View>
                <View style={styles.sortOptionContent}>
                  <Ionicons name="arrow-down" size={20} color={Colors.primary} />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === "price-low" && styles.sortOptionTextActive,
                    ]}
                  >
                    Price: Low to High
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "price-high" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("price-high");
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    sortBy === "price-high" && styles.radioCircleActive,
                  ]}
                >
                  {sortBy === "price-high" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.sortOptionContent}>
                  <Ionicons name="arrow-up" size={20} color={Colors.primary} />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === "price-high" && styles.sortOptionTextActive,
                    ]}
                  >
                    Price: High to Low
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Radius Selection Modal */}
      {showRadiusModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Radius</Text>
              <TouchableOpacity onPress={() => setShowRadiusModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <View style={styles.radiusOptions}>
              {[5, 10, 15, 20].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[
                    styles.radiusOption,
                    radius === km && styles.radiusOptionActive,
                  ]}
                  onPress={() => {
                    setRadius(km);
                    setShowRadiusModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      radius === km && styles.radioCircleActive,
                    ]}
                  >
                    {radius === km && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.radiusOptionText,
                      radius === km && styles.radiusOptionTextActive,
                    ]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalNote}>
              Showing available barbers within selected radius from your
              location
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function BarberCard({ barber }: { barber: Barber }) {
  // Calculate the lowest price from all services
  const lowestPrice =
    barber.services.length > 0
      ? Math.min(...barber.services.map((s) => s.price))
      : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(
          `/barber/${barber.id}${
            barber.distance ? `?distance=${barber.distance}` : ""
          }` as any
        )
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardInner}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: barber.avatar }} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.info}>
          {/* Section 1: Identity */}
          <View style={styles.identitySection}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {barber.name}
              </Text>
              {barber.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
              )}
            </View>
          </View>

          {/* Section Divider */}
          <View style={styles.sectionDivider} />

          {/* Section 2: Stats & Distance */}
          <View style={styles.statsSection}>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.rating}>{barber.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({barber.totalReviews} reviews)
              </Text>
              <Text style={styles.meta}>• {barber.completedJobs} jobs</Text>
            </View>

            {barber.distance && (
              <View style={styles.distanceRow}>
                <Ionicons name="navigate" size={14} color={Colors.primary} />
                <Text style={styles.distanceText}>
                  {formatDistance(barber.distance)}
                  {barber.durationMinutes &&
                    ` • ~${formatDuration(barber.durationMinutes)}`}
                </Text>
              </View>
            )}
          </View>

          {/* Section Divider */}
          <View style={styles.sectionDivider} />

          {/* Section 3: Price */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>{formatCurrency(lowestPrice)}</Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#C7C7CC"
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.4,
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F9731630",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  radiusButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F2F2F7",
  },
  resultCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#F9731630",
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "400",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  emptyText: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  locationRequiredIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  enableLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enableLocationButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: {
    flexDirection: "row",
    padding: 16,
    gap: 14,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  info: {
    flex: 1,
  },
  // Section 1: Identity
  identitySection: {
    paddingBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  // Section Divider
  sectionDivider: {
    height: 1,
    backgroundColor: "#F2F2F7",
    marginVertical: 10,
  },
  // Section 2: Stats
  statsSection: {
    paddingBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  rating: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  meta: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "400",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary,
  },
  // Section 3: Price
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chevron: {
    marginLeft: 8,
  },
  // Sort Modal styles
  sortOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  sortOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  sortOptionTextActive: {
    fontWeight: "600",
    color: Colors.primary,
  },
  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  radiusOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  radiusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    gap: 12,
  },
  radiusOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radiusOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  radiusOptionTextActive: {
    fontWeight: "600",
    color: Colors.primary,
  },
  modalNote: {
    fontSize: 13,
    color: "#8E8E93",
    paddingHorizontal: 20,
    paddingTop: 16,
    lineHeight: 18,
  },
  calculatingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F9731630",
  },
  calculatingText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
});
