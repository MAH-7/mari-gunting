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
import { Colors, theme } from '@mari-gunting/shared/theme';

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
              <Ionicons name="cut" size={40} color={Colors.white} />
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
            <View style={[styles.gradientCard, { backgroundColor: Colors.primary }]}>
              {/* Icon */}
              <View style={styles.cardIconContainer}>
                <Ionicons name="person" size={48} color={Colors.white} />
              </View>

              {/* Content */}
              <Text style={styles.cardTitle}>I'm a Customer</Text>
              <Text style={styles.cardDescription}>
                Book professional barbers & freelancers for home service
              </Text>

              {/* Features */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  <Text style={styles.featureText}>Book barbers instantly</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  <Text style={styles.featureText}>Home service convenience</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  <Text style={styles.featureText}>Verified professionals</Text>
                </View>
              </View>

              {/* Button */}
              <View style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Continue as Customer</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Barber/Freelance Card */}
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.9}
            onPress={() => handleSelectRole('barber')}
          >
            <View style={[styles.gradientCard, { backgroundColor: Colors.secondary }]}>
              {/* Icon */}
              <View style={styles.cardIconContainer}>
                <Ionicons name="cut-outline" size={48} color={Colors.white} />
              </View>

              {/* Content */}
              <Text style={styles.cardTitle}>I'm a Barber</Text>
              <Text style={styles.cardDescription}>
                Offer your services as a freelance barber or barbershop
              </Text>

              {/* Features */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <Text style={styles.featureText}>Earn extra income</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <Text style={styles.featureText}>Flexible schedule</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <Text style={styles.featureText}>Build your clientele</Text>
                </View>
              </View>

              {/* Button */}
              <View style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Continue as Barber</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.gray[500]} />
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
    backgroundColor: Colors.backgroundSecondary,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[500],
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
    color: Colors.white,
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
    backgroundColor: Colors.white,
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
    color: Colors.text.primary,
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
    color: Colors.gray[500],
    textAlign: 'center',
  },
});
