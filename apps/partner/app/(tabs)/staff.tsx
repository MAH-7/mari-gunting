import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { useState } from 'react';

interface StaffMember {
  id: string;
  name: string;
  specializations: string[];
  todayAppointments: number;
  weekRevenue: number;
  status: 'active' | 'off_duty';
  phone: string;
  commissionRate: number;
}

export default function StaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Rudi Hartono',
      specializations: ['Fade Cut', 'Beard Trim'],
      todayAppointments: 5,
      weekRevenue: 450,
      status: 'active',
      phone: '+60 11-2222 3333',
      commissionRate: 60,
    },
    {
      id: '2',
      name: 'Andi Wijaya',
      specializations: ['Haircut', 'Hair Color'],
      todayAppointments: 4,
      weekRevenue: 380,
      status: 'active',
      phone: '+60 12-3333 4444',
      commissionRate: 55,
    },
    {
      id: '3',
      name: 'Joko Susanto',
      specializations: ['Haircut', 'Shave'],
      todayAppointments: 3,
      weekRevenue: 320,
      status: 'off_duty',
      phone: '+60 13-4444 5555',
      commissionRate: 55,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    commissionRate: '60',
  });

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  const handleAddStaff = () => {
    setFormData({ name: '', phone: '', commissionRate: '60' });
    setEditingStaff(null);
    setShowAddModal(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setFormData({
      name: member.name,
      phone: member.phone,
      commissionRate: member.commissionRate.toString(),
    });
    setEditingStaff(member);
    setShowAddModal(true);
  };

  const handleSaveStaff = () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingStaff) {
      // Update existing staff
      setStaff(staff.map(s => 
        s.id === editingStaff.id 
          ? {
              ...s,
              name: formData.name,
              phone: formData.phone,
              commissionRate: parseInt(formData.commissionRate),
            }
          : s
      ));
    } else {
      // Add new staff
      const newStaff: StaffMember = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        specializations: ['Haircut'],
        todayAppointments: 0,
        weekRevenue: 0,
        status: 'active',
        commissionRate: parseInt(formData.commissionRate),
      };
      setStaff([...staff, newStaff]);
    }

    setShowAddModal(false);
  };

  const handleDeleteStaff = (id: string) => {
    Alert.alert(
      'Delete Staff',
      'Are you sure you want to remove this staff member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setStaff(staff.filter(s => s.id !== id)),
        },
      ]
    );
  };

  const toggleStaffStatus = (id: string) => {
    setStaff(staff.map(s =>
      s.id === id
        ? { ...s, status: s.status === 'active' ? 'off_duty' : 'active' }
        : s
    ));
  };

  const activeStaff = staff.filter(s => s.status === 'active');
  const totalWeekRevenue = staff.reduce((sum, s) => sum + s.weekRevenue, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Staff Management</Text>
            <Text style={styles.subtitle}>{activeStaff.length} Active Staff</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStaff}>
            <Ionicons name="add" size={24} color={COLORS.background.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{staff.length}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="cash" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{formatCurrency(totalWeekRevenue)}</Text>
            <Text style={styles.statLabel}>Week Revenue</Text>
          </View>
        </View>

        {/* Staff List */}
        <View style={styles.staffSection}>
          {staff.map((member) => (
            <View key={member.id} style={styles.staffCard}>
              <View style={styles.staffHeader}>
                <View style={styles.staffInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.staffDetails}>
                    <Text style={styles.staffName}>{member.name}</Text>
                    <Text style={styles.staffPhone}>{member.phone}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.statusToggle,
                    member.status === 'active' ? styles.statusActive : styles.statusInactive
                  ]}
                  onPress={() => toggleStaffStatus(member.id)}
                >
                  <Text style={[
                    styles.statusText,
                    member.status === 'active' ? styles.statusActiveText : styles.statusInactiveText
                  ]}>
                    {member.status === 'active' ? 'Active' : 'Off Duty'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.specializationsRow}>
                {member.specializations.map((spec, index) => (
                  <View key={index} style={styles.specializationChip}>
                    <Text style={styles.specializationText}>{spec}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.miniStat}>
                  <Ionicons name="calendar" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.miniStatValue}>{member.todayAppointments}</Text>
                  <Text style={styles.miniStatLabel}>Today</Text>
                </View>
                <View style={styles.miniStat}>
                  <Ionicons name="cash" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.miniStatValue}>{formatCurrency(member.weekRevenue)}</Text>
                  <Text style={styles.miniStatLabel}>This Week</Text>
                </View>
                <View style={styles.miniStat}>
                  <Ionicons name="percent" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.miniStatValue}>{member.commissionRate}%</Text>
                  <Text style={styles.miniStatLabel}>Commission</Text>
                </View>
              </View>

              <View style={styles.staffActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditStaff(member)}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteStaff(member.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingStaff ? 'Edit Staff' : 'Add New Staff'}
            </Text>
            <TouchableOpacity onPress={handleSaveStaff}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter staff name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="+62 xxx-xxxx-xxxx"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Commission Rate (%) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="60"
                value={formData.commissionRate}
                onChangeText={(text) => setFormData({ ...formData, commissionRate: text })}
                keyboardType="number-pad"
              />
              <Text style={styles.formHint}>
                The percentage of revenue this staff member receives
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  staffSection: {
    paddingHorizontal: 20,
  },
  staffCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  staffPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  statusActiveText: {
    color: COLORS.success,
  },
  statusInactiveText: {
    color: '#FF9800',
  },
  specializationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specializationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background.secondary,
  },
  specializationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  miniStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  staffActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.background.secondary,
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
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
    borderBottomColor: COLORS.background.secondary,
  },
  modalCancel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.secondary,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  modalSave: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    ...TYPOGRAPHY.body1,
    backgroundColor: COLORS.background.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  formHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
});
