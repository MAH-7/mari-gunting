import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl, Linking, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { getStatusColor, getStatusBackground } from '@/shared/constants/colors';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/services/mockData';
import { Booking } from '@/types';
import * as ImagePicker from 'expo-image-picker';

type FilterStatus = 'all' | 'pending' | 'active' | 'completed';

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export default function ProviderJobsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Job status overrides (simulating backend updates)
  const [jobStatusOverrides, setJobStatusOverrides] = useState<Record<string, string>>({});
  
  // Completion flow state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionChecklist, setCompletionChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'Service completed to satisfaction', checked: false },
    { id: '2', label: 'Area cleaned up', checked: false },
    { id: '3', label: 'Customer happy with result', checked: false },
    { id: '4', label: 'Payment confirmed', checked: false },
  ]);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  // Filter jobs by provider and apply status overrides
  const providerJobs = useMemo(() => {
    if (!currentUser) return [];
    return mockBookings
      .filter(b => b.barberId === currentUser.id)
      .map(job => ({
        ...job,
        status: jobStatusOverrides[job.id] || job.status
      }));
  }, [currentUser, jobStatusOverrides]);

  // Apply filters and search
  const filteredJobs = useMemo(() => {
    let jobs = providerJobs;

    // Filter by status
    if (filterStatus === 'pending') {
      jobs = jobs.filter(j => j.status === 'pending');
    } else if (filterStatus === 'active') {
      jobs = jobs.filter(j => ['accepted', 'on-the-way', 'in-progress'].includes(j.status));
    } else if (filterStatus === 'completed') {
      jobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      jobs = jobs.filter(j => 
        j.customer?.name.toLowerCase().includes(query) ||
        j.services?.some(s => s.name.toLowerCase().includes(query))
      );
    }

    // Sort by date (newest first)
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [providerJobs, filterStatus, searchQuery]);

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    all: providerJobs.length,
    pending: providerJobs.filter(j => j.status === 'pending').length,
    active: providerJobs.filter(j => ['accepted', 'on-the-way', 'in-progress'].includes(j.status)).length,
    completed: providerJobs.filter(j => ['completed', 'cancelled'].includes(j.status)).length,
  }), [providerJobs]);

  // Calculate analytics for completed jobs
  const completedJobsAnalytics = useMemo(() => {
    const completed = providerJobs.filter(j => j.status === 'completed');
    const totalEarnings = completed.reduce((sum, job) => sum + job.totalPrice, 0);
    const totalJobs = completed.length;
    const averageEarning = totalJobs > 0 ? totalEarnings / totalJobs : 0;
    
    // Calculate this month's stats
    const now = new Date();
    const thisMonth = completed.filter(job => {
      const jobDate = new Date(job.completedAt || job.updatedAt);
      return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
    });
    const monthlyEarnings = thisMonth.reduce((sum, job) => sum + job.totalPrice, 0);
    const monthlyJobs = thisMonth.length;

    return {
      totalEarnings,
      totalJobs,
      averageEarning,
      monthlyEarnings,
      monthlyJobs,
      completedJobs: completed,
    };
  }, [providerJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const updateJobStatus = (jobId: string, newStatus: string) => {
    setJobStatusOverrides(prev => ({ ...prev, [jobId]: newStatus }));
    // Update selectedJob if it's the current one
    if (selectedJob?.id === jobId) {
      setSelectedJob({ ...selectedJob, status: newStatus });
    }
  };

  const handleAcceptJob = (job: Booking) => {
    Alert.alert(
      'Accept Job',
      `Accept booking from ${job.customer?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            updateJobStatus(job.id, 'accepted');
            Alert.alert('Success', 'Job accepted successfully!');
            // Don't close modal, let user see updated status
          },
        },
      ]
    );
  };

  const handleRejectJob = (job: Booking) => {
    Alert.alert(
      'Reject Job',
      `Are you sure you want to reject this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            updateJobStatus(job.id, 'cancelled');
            Alert.alert('Job Rejected', 'You can still view this in your history.');
            setSelectedJob(null);
          },
        },
      ]
    );
  };

  const handleOnTheWay = (job: Booking) => {
    Alert.alert(
      "I'm on the way",
      `Let ${job.customer?.name} know you're heading to their location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I'm on the way",
          onPress: () => {
            updateJobStatus(job.id, 'on-the-way');
            Alert.alert('Status Updated', 'Customer has been notified that you\'re on the way!');
            // Don't close modal, let user see updated status and timeline
          },
        },
      ]
    );
  };

  const handleArrived = (job: Booking) => {
    Alert.alert(
      'Arrived at Location',
      `Confirm you've arrived at ${job.customer?.name}'s location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Arrival',
          onPress: () => {
            updateJobStatus(job.id, 'arrived');
            Alert.alert('Arrival Confirmed', 'Customer notified of your arrival!');
            // Don't close modal
          },
        },
      ]
    );
  };

  const handleStartJob = (job: Booking) => {
    Alert.alert(
      'Start Service',
      'Begin providing the service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Service',
          onPress: () => {
            updateJobStatus(job.id, 'in-progress');
            Alert.alert('Service Started', 'Timer started. Good luck!');
            // Don't close modal
          },
        },
      ]
    );
  };

  const handleCompleteJob = (job: Booking) => {
    // Ensure job data is available
    if (!job || !job.id) {
      Alert.alert('Error', 'Unable to load job details');
      return;
    }
    // Open completion modal
    console.log('Opening completion modal for job:', job.id);
    // Keep selectedJob but show completion modal
    setShowCompletionModal(true);
  };
  
  const handleFinalizeCompletion = () => {
    const allChecked = completionChecklist.every(item => item.checked);
    
    if (!allChecked) {
      Alert.alert(
        'Incomplete Checklist',
        'Please complete all checklist items before finishing.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (afterPhotos.length === 0) {
      Alert.alert(
        'No Photos',
        'Would you like to add at least one "after" photo of your work?',
        [
          { 
            text: 'Add Photo', 
            onPress: () => {} // User can still add photo
          },
          {
            text: 'Complete Anyway',
            onPress: () => finalizeJobCompletion()
          }
        ]
      );
      return;
    }
    
    finalizeJobCompletion();
  };
  
  const finalizeJobCompletion = () => {
    // Update job status to completed
    if (selectedJob) {
      updateJobStatus(selectedJob.id, 'completed');
    }
    
    // TODO: Submit completion data to backend
    Alert.alert(
      'Job Completed! 🎉',
      `Great work! RM ${selectedJob?.totalPrice} will be credited to your account.`,
      [
        {
          text: 'Done',
          onPress: () => {
            setShowCompletionModal(false);
            setSelectedJob(null);
            // Reset completion state
            setCompletionChecklist([
              { id: '1', label: 'Service completed to satisfaction', checked: false },
              { id: '2', label: 'Area cleaned up', checked: false },
              { id: '3', label: 'Customer happy with result', checked: false },
              { id: '4', label: 'Payment confirmed', checked: false },
            ]);
            setBeforePhotos([]);
            setAfterPhotos([]);
          }
        }
      ]
    );
  };
  
  const toggleChecklistItem = (id: string) => {
    setCompletionChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  const pickImage = async (type: 'before' | 'after') => {
    try {
      console.log('Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      console.log('Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant photo library permissions in Settings to add photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('Selected photo URI:', photoUri);
        if (type === 'before') {
          setBeforePhotos(prev => [...prev, photoUri]);
        } else {
          setAfterPhotos(prev => [...prev, photoUri]);
        }
      } else {
        console.log('Image selection cancelled or no assets');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(
        'Error', 
        `Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      );
    }
  };
  
  const takePhoto = async (type: 'before' | 'after') => {
    try {
      console.log('Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      console.log('Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions in Settings to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('Captured photo URI:', photoUri);
        if (type === 'before') {
          setBeforePhotos(prev => [...prev, photoUri]);
        } else {
          setAfterPhotos(prev => [...prev, photoUri]);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        'Error', 
        `Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      );
    }
  };
  
  const removePhoto = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setBeforePhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const showPhotoOptions = (type: 'before' | 'after') => {
    Alert.alert(
      'Add Photo',
      'Choose photo source',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => takePhoto(type) },
        { text: 'Choose from Library', onPress: () => pickImage(type) },
      ]
    );
  };

  // Week 4: Navigation & Contact handlers
  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleChatCustomer = (customerId: string, customerName: string) => {
    // TODO: Navigate to in-app chat screen when implemented
    Alert.alert(
      'Chat with Customer',
      `Start a chat with ${customerName}?\n\nIn-app messaging coming soon!\n\nFor now, you can call the customer.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Instead', onPress: () => handleCallCustomer(selectedJob?.customer?.phone || '') }
      ]
    );
    // Future: router.push(`/chat/${customerId}`);
  };

  const handleGetDirections = (address: string, latitude?: number, longitude?: number) => {
    // Try to use coordinates if available, otherwise use address
    let url = '';
    
    if (latitude && longitude) {
      // Use coordinates for more accurate navigation
      if (Platform.OS === 'ios') {
        url = `maps://app?daddr=${latitude},${longitude}`;
      } else {
        url = `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(address)})`;
      }
    } else {
      // Fallback to address-based navigation
      const encodedAddress = encodeURIComponent(address);
      if (Platform.OS === 'ios') {
        url = `maps://app?daddr=${encodedAddress}`;
      } else {
        url = `geo:0,0?q=${encodedAddress}`;
      }
    }

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps in browser
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        Linking.openURL(googleMapsUrl);
      }
    }).catch(() => {
      Alert.alert('Error', 'Unable to open maps application');
    });
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            Alert.alert(
              'Sort & Filter Options',
              'Advanced sorting and filtering options coming soon!\n\n• Sort by date\n• Sort by price\n• Filter by distance\n• Filter by service type',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="options-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, customers..."
          placeholderTextColor={COLORS.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterStatus === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus(filter.key as FilterStatus)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterBadge,
                filterStatus === filter.key && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  filterStatus === filter.key && styles.filterBadgeTextActive,
                ]}
              >
                {filterCounts[filter.key as keyof typeof filterCounts]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Jobs List */}
      <ScrollView
        style={styles.jobsList}
        contentContainerStyle={styles.jobsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Analytics Section - Show when viewing completed jobs */}
        {filterStatus === 'completed' && completedJobsAnalytics.totalJobs > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>📊 Performance Overview</Text>
            
            {/* Stats Cards */}
            <View style={styles.analyticsGrid}>
              {/* Total Earnings */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIcon}>
                  <Ionicons name="wallet" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.analyticsLabel}>Total Earnings</Text>
                <Text style={styles.analyticsValue}>RM {completedJobsAnalytics.totalEarnings.toFixed(2)}</Text>
                <Text style={styles.analyticsSubtext}>{completedJobsAnalytics.totalJobs} jobs completed</Text>
              </View>

              {/* This Month */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIcon}>
                  <Ionicons name="calendar" size={24} color={COLORS.info} />
                </View>
                <Text style={styles.analyticsLabel}>This Month</Text>
                <Text style={styles.analyticsValue}>RM {completedJobsAnalytics.monthlyEarnings.toFixed(2)}</Text>
                <Text style={styles.analyticsSubtext}>{completedJobsAnalytics.monthlyJobs} jobs</Text>
              </View>
            </View>

            <View style={styles.analyticsGrid}>
              {/* Average per Job */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIcon}>
                  <Ionicons name="trending-up" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.analyticsLabel}>Avg per Job</Text>
                <Text style={styles.analyticsValue}>RM {completedJobsAnalytics.averageEarning.toFixed(2)}</Text>
                <Text style={styles.analyticsSubtext}>Average earnings</Text>
              </View>

              {/* Completion Rate */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIcon}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.analyticsLabel}>Completed</Text>
                <Text style={styles.analyticsValue}>{completedJobsAnalytics.totalJobs}</Text>
                <Text style={styles.analyticsSubtext}>Successful jobs</Text>
              </View>
            </View>

            <Text style={styles.jobHistoryTitle}>Job History</Text>
          </View>
        )}

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={searchQuery ? 'search' : 'briefcase-outline'} 
              size={64} 
              color={COLORS.text.tertiary} 
            />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No Results Found' : 'No Jobs Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Your bookings will appear here'}
            </Text>
            
            {/* Test Data Button */}
            {!searchQuery && providerJobs.length === 0 && (
              <TouchableOpacity
                style={styles.testDataButton}
                onPress={() => {
                  Alert.alert(
                    '🧪 Testing Tip',
                    'To see jobs with data:\n\n1. Jobs filter by your User ID\n2. Mock data has barber IDs: b1, b2, b3\n3. Your ID may not match\n\nTo test new features:\n• View existing mock jobs by ensuring user ID matches a barber ID\n• Or we can add test jobs for your user ID',
                    [
                      { text: 'Got it' },
                      {
                        text: 'Use Test Barber',
                        onPress: () => {
                          Alert.alert('Switch User', 'Log out and login with:\nEmail: amir.hafiz@email.com\n(Any password works in mock)');
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="flask" size={20} color={COLORS.info} />
                <Text style={styles.testDataButtonText}>🧪 Why No Jobs?</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              activeOpacity={0.7}
              onPress={() => setSelectedJob(job)}
            >
              {/* Job Card Content */}
              <View style={styles.jobCardHeader}>
                <View style={styles.jobCardLeft}>
                  <View style={[styles.jobStatusDot, { backgroundColor: getStatusColor(job.status) }]} />
                  <View>
                    <Text style={styles.jobCustomerName}>{job.customer?.name || 'Customer'}</Text>
                    <Text style={styles.jobDate}>
                      {job.scheduledDate} • {job.scheduledTime}
                    </Text>
                  </View>
                </View>
                <View style={[styles.jobStatusBadge, { backgroundColor: getStatusBackground(job.status) }]}>
                  <Text style={[styles.jobStatusText, { color: getStatusColor(job.status) }]}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('-', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardBody}>
                <View style={styles.jobInfoRow}>
                  <Ionicons name="cut" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.jobInfoText}>
                    {job.services?.map(s => s.name).join(', ') || 'Service'}
                  </Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <Ionicons name="location" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.jobInfoText} numberOfLines={1}>
                    {job.address?.fullAddress || 'Location'}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardFooter}>
                <Text style={styles.jobPrice}>RM {job.totalPrice}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Job Details Modal */}
      <Modal
        visible={selectedJob !== null && !showCompletionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedJob(null)}
      >
        {selectedJob && !showCompletionModal && (
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedJob(null)}>
                <Ionicons name="close" size={28} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Job Details</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Status Banner */}
              <View style={[styles.statusBanner, { backgroundColor: getStatusBackground(selectedJob.status) }]}>
                <Ionicons name="information-circle" size={24} color={getStatusColor(selectedJob.status)} />
                <Text style={[styles.statusBannerText, { color: getStatusColor(selectedJob.status) }]}>
                  {selectedJob.status === 'pending' && 'Waiting for your response'}
                  {selectedJob.status === 'accepted' && 'Job accepted, ready to start'}
                  {selectedJob.status === 'on-the-way' && 'On the way to customer'}
                  {selectedJob.status === 'in-progress' && 'Job in progress'}
                  {selectedJob.status === 'completed' && 'Job completed successfully'}
                  {selectedJob.status === 'cancelled' && 'This job was cancelled'}
                </Text>
              </View>

              {/* Progress Timeline - Only show for active jobs */}
              {!['completed', 'cancelled', 'pending'].includes(selectedJob.status) && selectedJob.status !== 'arrived' && (
                <View style={styles.timelineSection}>
                  <Text style={styles.timelineSectionTitle}>Job Progress</Text>
                  <View style={styles.timeline}>
                    {/* Accepted */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[styles.timelineDot, styles.timelineDotCompleted]}>
                          <Ionicons name="checkmark" size={12} color={COLORS.background.primary} />
                        </View>
                        {selectedJob.status !== 'accepted' && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Accepted</Text>
                        <Text style={styles.timelineTime}>Job accepted</Text>
                      </View>
                    </View>

                    {/* On the way */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[
                          styles.timelineDot,
                          ['on-the-way', 'in-progress'].includes(selectedJob.status) && styles.timelineDotCompleted,
                          selectedJob.status === 'accepted' && styles.timelineDotPending
                        ]}>
                          {['on-the-way', 'in-progress'].includes(selectedJob.status) && (
                            <Ionicons name="checkmark" size={12} color={COLORS.background.primary} />
                          )}
                        </View>
                        {selectedJob.status !== 'on-the-way' && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>On the way</Text>
                        <Text style={styles.timelineTime}>
                          {['on-the-way', 'in-progress'].includes(selectedJob.status) ? 'Heading to location' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {/* In Progress */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[
                          styles.timelineDot,
                          selectedJob.status === 'in-progress' && styles.timelineDotActive,
                          !['accepted', 'on-the-way'].includes(selectedJob.status) && styles.timelineDotPending
                        ]}>
                          {selectedJob.status === 'in-progress' && (
                            <View style={styles.timelineDotPulse} />
                          )}
                        </View>
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Service in Progress</Text>
                        <Text style={styles.timelineTime}>
                          {selectedJob.status === 'in-progress' ? 'Currently servicing' : 'Not started'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Customer Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Customer</Text>
                <View style={styles.customerInfo}>
                  <View style={styles.customerAvatar}>
                    <Ionicons name="person" size={32} color={COLORS.primary} />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{selectedJob.customer?.name}</Text>
                    <Text style={styles.customerContact}>{selectedJob.customer?.phone}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleCallCustomer(selectedJob.customer?.phone || '')}
                  >
                    <Ionicons name="call" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                
                {/* Contact Actions */}
                <View style={styles.contactActions}>
                  <TouchableOpacity 
                    style={styles.contactActionButton}
                    onPress={() => handleCallCustomer(selectedJob.customer?.phone || '')}
                  >
                    <Ionicons name="call" size={20} color={COLORS.primary} />
                    <Text style={styles.contactActionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.contactActionButton}
                    onPress={() => handleChatCustomer(
                      selectedJob.customer?.id || '',
                      selectedJob.customer?.name || 'Customer'
                    )}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.info} />
                    <Text style={styles.contactActionText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Services */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Services</Text>
                {selectedJob.services?.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDuration}>{service.duration} min</Text>
                    </View>
                    <Text style={styles.servicePrice}>RM {service.price}</Text>
                  </View>
                ))}
              </View>

              {/* Date & Time */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Schedule</Text>
                <View style={styles.scheduleInfo}>
                  <View style={styles.scheduleRow}>
                    <Ionicons name="calendar" size={20} color={COLORS.text.secondary} />
                    <Text style={styles.scheduleText}>{selectedJob.scheduledDate}</Text>
                  </View>
                  <View style={styles.scheduleRow}>
                    <Ionicons name="time" size={20} color={COLORS.text.secondary} />
                    <Text style={styles.scheduleText}>{selectedJob.scheduledTime}</Text>
                  </View>
                </View>
              </View>

              {/* Location */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Location</Text>
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <Text style={styles.locationText}>{selectedJob.address?.fullAddress}</Text>
                </View>
                {selectedJob.address?.notes && (
                  <Text style={styles.locationNotes}>Note: {selectedJob.address.notes}</Text>
                )}
                
                {/* Distance Info */}
                {selectedJob.distance && (
                  <View style={styles.distanceInfo}>
                    <Ionicons name="navigate" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.distanceText}>{selectedJob.distance} km away</Text>
                  </View>
                )}
                
                {/* Navigation Button */}
                <TouchableOpacity 
                  style={styles.directionsButton}
                  onPress={() => handleGetDirections(
                    selectedJob.address?.fullAddress || '',
                    selectedJob.address?.latitude,
                    selectedJob.address?.longitude
                  )}
                >
                  <Ionicons name="navigate" size={20} color={COLORS.background.primary} />
                  <Text style={styles.directionsButtonText}>Get Directions</Text>
                </TouchableOpacity>
              </View>

              {/* Notes */}
              {selectedJob.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Customer Notes</Text>
                  <Text style={styles.notesText}>{selectedJob.notes}</Text>
                </View>
              )}

              {/* Price Breakdown */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Payment</Text>
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Services</Text>
                    <Text style={styles.priceValue}>
                      RM {selectedJob.services?.reduce((sum, s) => sum + s.price, 0)}
                    </Text>
                  </View>
                  {selectedJob.travelCost && selectedJob.travelCost > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Travel Fee</Text>
                      <Text style={styles.priceValue}>RM {selectedJob.travelCost}</Text>
                    </View>
                  )}
                  <View style={styles.priceDivider} />
                  <View style={styles.priceRow}>
                    <Text style={styles.priceTotalLabel}>Total</Text>
                    <Text style={styles.priceTotalValue}>RM {selectedJob.totalPrice}</Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            {selectedJob.status !== 'completed' && selectedJob.status !== 'cancelled' && (
              <View style={styles.modalActions}>
                {selectedJob.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectJob(selectedJob)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptJob(selectedJob)}
                    >
                      <Text style={styles.acceptButtonText}>Accept Job</Text>
                    </TouchableOpacity>
                  </>
                )}
                {selectedJob.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleOnTheWay(selectedJob)}
                  >
                    <Ionicons name="navigate" size={20} color={COLORS.background.primary} />
                    <Text style={styles.primaryButtonText}>I'm on the way</Text>
                  </TouchableOpacity>
                )}
                {selectedJob.status === 'on-the-way' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleArrived(selectedJob)}
                  >
                    <Ionicons name="location" size={20} color={COLORS.background.primary} />
                    <Text style={styles.primaryButtonText}>I've Arrived</Text>
                  </TouchableOpacity>
                )}
                {selectedJob.status === 'arrived' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleStartJob(selectedJob)}
                  >
                    <Ionicons name="play-circle" size={20} color={COLORS.background.primary} />
                    <Text style={styles.primaryButtonText}>Start Service</Text>
                  </TouchableOpacity>
                )}
                {selectedJob.status === 'in-progress' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleCompleteJob(selectedJob)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.background.primary} />
                    <Text style={styles.primaryButtonText}>Complete Job</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </SafeAreaView>
        )}
      </Modal>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal && selectedJob !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        {showCompletionModal && selectedJob && (
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCompletionModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Complete Job</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
            >
            {/* Completion Banner */}
            <View style={styles.completionBanner}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              <Text style={styles.completionBannerTitle}>Almost Done!</Text>
              <Text style={styles.completionBannerText}>
                Complete the checklist and add photos before finishing
              </Text>
            </View>

            {/* Service Checklist */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Service Checklist</Text>
              <Text style={styles.sectionSubtitle}>Verify all items before completing</Text>
              {completionChecklist.map((item) => (
                <TouchableOpacity
                  key={`checklist-${item.id}`}
                  style={styles.checklistItem}
                  onPress={() => toggleChecklistItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    item.checked && styles.checkboxChecked
                  ]}>
                    {item.checked && (
                      <Ionicons name="checkmark" size={18} color={COLORS.background.primary} />
                    )}
                  </View>
                  <Text style={[
                    styles.checklistLabel,
                    item.checked && styles.checklistLabelChecked
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Before Photos */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Before Photos (Optional)</Text>
              <Text style={styles.sectionSubtitle}>Show the initial state</Text>
              <View style={styles.photosGrid}>
                {beforePhotos.map((uri, index) => (
                  <View key={`before-${index}-${uri.substring(0, 10)}`} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.photoRemoveButton}
                      onPress={() => removePhoto('before', index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {beforePhotos.length < 3 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => showPhotoOptions('before')}
                  >
                    <Ionicons name="camera" size={32} color={COLORS.text.tertiary} />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* After Photos */}
            <View style={styles.detailSection}>
              <View style={styles.photoHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailSectionTitle}>After Photos</Text>
                  <Text style={styles.sectionSubtitle}>Show your great work! ✨</Text>
                </View>
                {afterPhotos.length === 0 && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Recommended</Text>
                  </View>
                )}
              </View>
              <View style={styles.photosGrid}>
                {afterPhotos.map((uri, index) => (
                  <View key={`after-${index}-${uri.substring(0, 10)}`} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.photoRemoveButton}
                      onPress={() => removePhoto('after', index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {afterPhotos.length < 3 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => showPhotoOptions('after')}
                  >
                    <Ionicons name="camera" size={32} color={COLORS.text.tertiary} />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Job Summary */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Job Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue}>{selectedJob?.customer?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Services</Text>
                <Text style={styles.summaryValue}>
                  {selectedJob?.services?.map(s => s.name).join(', ')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{selectedJob?.duration} min</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total Payment</Text>
                <Text style={styles.summaryTotalValue}>RM {selectedJob?.totalPrice}</Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Complete Button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.completeJobButton,
                !completionChecklist.every(item => item.checked) && styles.completeJobButtonDisabled
              ]}
              onPress={handleFinalizeCompletion}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.background.primary} />
              <Text style={styles.completeJobButtonText}>Complete & Submit</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  filterTabs: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterTabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background.primary,
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  filterTabTextActive: {
    color: COLORS.text.inverse,
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.background.tertiary,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  filterBadgeTextActive: {
    color: COLORS.text.inverse,
  },
  jobsList: {
    flex: 1,
  },
  jobsListContent: {
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  jobCustomerName: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  jobDate: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  jobStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  jobCardBody: {
    marginBottom: 12,
    gap: 8,
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobInfoText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  jobPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  testDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  testDataButtonText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '700',
    color: COLORS.info,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  modalContent: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 12,
  },
  statusBannerText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    flex: 1,
  },
  detailSection: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  detailSectionTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  customerContact: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  contactActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactActionText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  serviceDuration: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  servicePrice: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scheduleInfo: {
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  locationText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    flex: 1,
  },
  locationNotes: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  distanceText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  directionsButtonText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '700',
    color: COLORS.background.primary,
  },
  notesText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  priceValue: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 4,
  },
  priceTotalLabel: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  // Timeline Styles
  timelineSection: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  timelineSectionTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  timelineDotCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelineDotActive: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  timelineDotPending: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.medium,
  },
  timelineDotPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background.primary,
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.border.light,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineLabel: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  timelineTime: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  // Completion Modal Styles
  completionBanner: {
    alignItems: 'center',
    padding: 24,
    margin: 20,
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
  },
  completionBannerTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  completionBannerText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    marginTop: -8,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checklistLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    flex: 1,
  },
  checklistLabelChecked: {
    color: COLORS.text.secondary,
    textDecorationLine: 'line-through',
  },
  photoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requiredBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    borderStyle: 'dashed',
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  summaryValue: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  completeJobButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeJobButtonDisabled: {
    backgroundColor: COLORS.text.tertiary,
    opacity: 0.5,
  },
  completeJobButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.background.primary,
  },
  // Analytics Styles
  analyticsSection: {
    marginBottom: 20,
  },
  analyticsSectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginBottom: 16,
    fontWeight: '700',
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  analyticsLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  analyticsValue: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsSubtext: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  jobHistoryTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: 12,
  },
});
