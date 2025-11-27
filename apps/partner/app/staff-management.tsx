import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { staffService, Staff, CreateStaffInput, UpdateStaffInput } from '@mari-gunting/shared/services/staffService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { Colors } from '@mari-gunting/shared/theme';
import { COLORS } from '@/shared/constants';

const ROLES = ['Senior Barber', 'Barber', 'Junior Barber', 'Stylist', 'Trainee'];

export default function StaffManagementScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Get barbershop ID
      const { data: barbershop, error: shopError } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', currentUser.id)
        .single();

      if (shopError || !barbershop) {
        Alert.alert('Error', 'Barbershop not found');
        return;
      }

      setBarbershopId(barbershop.id);

      // Load staff
      const staffData = await staffService.getStaffByBarbershopId(barbershop.id);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setFormData({ name: '', role: '' });
    setEditingStaff(null);
    setShowModal(true);
  };

  const handleEditStaff = (member: Staff) => {
    setFormData({
      name: member.name,
      role: member.role,
    });
    setEditingStaff(member);
    setShowModal(true);
  };

  const handleSaveStaff = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter staff member name');
      return;
    }
    if (!formData.role) {
      Alert.alert('Role Required', 'Please select a role');
      return;
    }
    if (!barbershopId) {
      Alert.alert('Error', 'Barbershop not found');
      return;
    }

    try {
      setSaving(true);

      if (editingStaff) {
        // Update existing staff
        const updates: UpdateStaffInput = {
          name: formData.name.trim(),
          role: formData.role,
        };
        await staffService.updateStaff(editingStaff.id, updates);
      } else {
        // Create new staff
        const newStaff: CreateStaffInput = {
          name: formData.name.trim(),
          role: formData.role,
        };
        await staffService.createStaff(barbershopId, newStaff);
      }

      setShowModal(false);
      loadData(); // Reload list
      Alert.alert('Success', `Staff member ${editingStaff ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving staff:', error);
      Alert.alert('Error', 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = (member: Staff) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await staffService.deleteStaff(member.id);
              loadData();
              Alert.alert('Success', 'Staff member removed');
            } catch (error) {
              console.error('Error deleting staff:', error);
              Alert.alert('Error', 'Failed to delete staff member');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (member: Staff) => {
    try {
      await staffService.toggleStaffActive(member.id, !member.is_active);
      loadData();
    } catch (error) {
      console.error('Error toggling staff active:', error);
      Alert.alert('Error', 'Failed to update staff status');
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading staff...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeStaff = staff.filter((s) => s.is_active);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity onPress={handleAddStaff} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{staff.length}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
            <Text style={styles.statValue}>{activeStaff.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Staff List */}
        {staff.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Staff Yet</Text>
            <Text style={styles.emptyText}>Add your first staff member to get started</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddStaff}>
              <Text style={styles.emptyButtonText}>Add Staff Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.staffList}>
            {staff.map((member) => (
              <View key={member.id} style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{member.name}</Text>
                    <Text style={styles.staffRole}>{member.role}</Text>
                  </View>
                  <Switch
                    value={member.is_active}
                    onValueChange={() => handleToggleActive(member)}
                    trackColor={{ false: '#E0E0E0', true: Colors.primaryLight }}
                    thumbColor={member.is_active ? Colors.primary : '#F5F5F5'}
                  />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditStaff(member)}
                  >
                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteStaff(member)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter staff name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              {/* Role */}
              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.roleButtons}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      formData.role === role && styles.roleButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        formData.role === role && styles.roleButtonTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveStaff}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  staffList: {
    paddingHorizontal: 20,
  },
  staffCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 14,
    color: '#666',
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
  },
  specChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.errorLight,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#FFF',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  specChipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  specChipButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  specChipButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  specChipButtonTextActive: {
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
