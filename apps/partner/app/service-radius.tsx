import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { ServiceRadiusSettings } from '@/components/ServiceRadiusSettings';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { barberService, BarberProfile } from '@/shared/services/barberService';
import { COLORS } from '@/shared/constants';

export default function ServiceRadiusScreen() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser?.id) return;
    
    try {
      setIsLoading(true);
      const barberProfile = await barberService.getBarberProfileByUserId(currentUser.id);
      if (barberProfile) {
        setProfile(barberProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Radius</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About Service Radius</Text>
            <Text style={styles.infoText}>
              Your service radius determines how far you're willing to travel to serve customers. 
              This helps match you with customers within your preferred distance.
            </Text>
          </View>
        </View>

        {/* Service Radius Settings Component */}
        {profile?.barberId && profile?.serviceRadiusKm && (
          <ServiceRadiusSettings
            barberId={profile.barberId}
            currentRadius={profile.serviceRadiusKm}
            onRadiusChanged={async (newRadius) => {
              setProfile(prev => prev ? { ...prev, serviceRadiusKm: newRadius } : null);
              await loadProfile();
            }}
          />
        )}

        {/* Guidelines Card */}
        <View style={styles.guidelinesCard}>
          <View style={styles.guidelinesHeader}>
            <Ionicons name="bulb-outline" size={22} color="#FF9800" />
            <Text style={styles.guidelinesTitle}>Choosing Your Radius</Text>
          </View>
          
          <View style={styles.guidelinesList}>
            <View style={styles.guidelineItem}>
              <View style={styles.guidelineBullet}>
                <Text style={styles.guidelineBulletText}>5km</Text>
              </View>
              <View style={styles.guidelineContent}>
                <Text style={styles.guidelineLabel}>Nearby Only</Text>
                <Text style={styles.guidelineDescription}>
                  Dense urban areas, walking/cycling distance
                </Text>
              </View>
            </View>

            <View style={styles.guidelineItem}>
              <View style={styles.guidelineBullet}>
                <Text style={styles.guidelineBulletText}>10km</Text>
              </View>
              <View style={styles.guidelineContent}>
                <Text style={styles.guidelineLabel}>Short Distance</Text>
                <Text style={styles.guidelineDescription}>
                  Standard urban, short drives
                </Text>
              </View>
            </View>

            <View style={styles.guidelineItem}>
              <View style={styles.guidelineBullet}>
                <Text style={styles.guidelineBulletText}>15km</Text>
              </View>
              <View style={styles.guidelineContent}>
                <Text style={styles.guidelineLabel}>Medium Distance</Text>
                <Text style={styles.guidelineDescription}>
                  Suburban, willing to travel further
                </Text>
              </View>
            </View>

            <View style={styles.guidelineItem}>
              <View style={styles.guidelineBullet}>
                <Text style={styles.guidelineBulletText}>20km</Text>
              </View>
              <View style={styles.guidelineContent}>
                <Text style={styles.guidelineLabel}>Long Distance</Text>
                <Text style={styles.guidelineDescription}>
                  Rural areas, maximum coverage
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#7E3AF2" />
            <Text style={styles.tipsTitle}>Best Practices</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={18} color="#7E3AF2" />
              <Text style={styles.tipText}>
                Consider travel time during peak hours
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={18} color="#7E3AF2" />
              <Text style={styles.tipText}>
                Factor in fuel costs for longer distances
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={18} color="#7E3AF2" />
              <Text style={styles.tipText}>
                Start conservative, increase if needed
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={18} color="#7E3AF2" />
              <Text style={styles.tipText}>
                Plan changes strategically due to 24h cooldown
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
    lineHeight: 18,
  },

  // Guidelines Card
  guidelinesCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  guidelinesList: {
    gap: 16,
  },
  guidelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  guidelineBullet: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7E3AF2',
  },
  guidelineBulletText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E3AF2',
  },
  guidelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  guidelineLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  guidelineDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    lineHeight: 18,
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    lineHeight: 20,
  },
});
