import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SelectRoleScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string || '';

  const handleSelectRole = (role: 'customer' | 'barber') => {
    // Navigate to register screen to complete profile
    router.push({ 
      pathname: '/register', 
      params: { phoneNumber, role } 
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="cut" size={40} color="#FFFFFF" />
            </View>
          </View>
          
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            Choose how you want to use MariGunting
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Customer Card */}
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.9}
            onPress={() => handleSelectRole('customer')}
          >
            <LinearGradient
              colors={['#7E3AF2', '#6C2BD9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              {/* Icon */}
              <View style={styles.cardIconContainer}>
                <Ionicons name="person" size={48} color="#FFFFFF" />
              </View>

              {/* Content */}
              <Text style={styles.cardTitle}>I'm a Customer</Text>
              <Text style={styles.cardDescription}>
                Book professional barbers & freelancers for home service
              </Text>

              {/* Features */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>Book barbers instantly</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>Home service convenience</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>Verified professionals</Text>
                </View>
              </View>

              {/* Button */}
              <View style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Continue as Customer</Text>
                <Ionicons name="arrow-forward" size={20} color="#7E3AF2" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Barber/Freelance Card */}
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.9}
            onPress={() => handleSelectRole('barber')}
          >
            <LinearGradient
              colors={['#1E293B', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              {/* Icon */}
              <View style={styles.cardIconContainer}>
                <Ionicons name="cut-outline" size={48} color="#FFFFFF" />
              </View>

              {/* Content */}
              <Text style={styles.cardTitle}>I'm a Barber</Text>
              <Text style={styles.cardDescription}>
                Offer your services as a freelance barber or barbershop
              </Text>

              {/* Features */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#7E3AF2" />
                  <Text style={styles.featureText}>Earn extra income</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#7E3AF2" />
                  <Text style={styles.featureText}>Flexible schedule</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#7E3AF2" />
                  <Text style={styles.featureText}>Build your clientele</Text>
                </View>
              </View>

              {/* Button */}
              <View style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Continue as Barber</Text>
                <Ionicons name="arrow-forward" size={20} color="#7E3AF2" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.helpText}>
            You can change this later in your profile settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7E3AF2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7E3AF2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 24,
  },
  roleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientCard: {
    padding: 24,
  },
  cardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  cardButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
