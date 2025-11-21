/**
 * ChatScreen Component
 * Real-time chat between customers and barbers for active bookings
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import {
  sendMessage,
  getMessages,
  markAllMessagesAsRead,
  subscribeToMessages,
  Message,
} from '../services/chatService';

interface ChatScreenProps {
  bookingId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  onBack?: () => void;
}

export default function ChatScreen({
  bookingId,
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  onBack,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // =====================================================
  // LOAD MESSAGES
  // =====================================================

  useEffect(() => {
    loadMessages();
    markMessagesAsRead();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMessages(
      bookingId,
      (newMessage) => {
        setMessages((prev) => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {
            return prev;
          }
          return [...prev, newMessage];
        });
        markMessagesAsRead();
        // Scrolling handled by FlatList onContentSizeChange
      },
      (updatedMessage) => {
        // Handle read receipt updates
        setMessages((prev) =>
          prev.map(msg =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [bookingId]);

  const loadMessages = async () => {
    setIsLoading(true);
    const result = await getMessages(bookingId);
    
    if (result.success && result.data) {
      setMessages(result.data);
      // Scrolling handled by FlatList onLayout
    } else {
      Alert.alert('Error', result.error || 'Failed to load messages');
    }
    
    setIsLoading(false);
  };

  const markMessagesAsRead = async () => {
    await markAllMessagesAsRead(bookingId, currentUserId);
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = async () => {
    if (!inputText.trim() && !isUploading) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    const result = await sendMessage({
      bookingId,
      senderId: currentUserId,
      receiverId: otherUserId,
      message: textToSend,
    });

    setIsSending(false);

    if (result.success) {
      // Don't add message manually - real-time subscription will handle it
      // This prevents duplicates
    } else {
      Alert.alert('Error', result.error || 'Failed to send message');
      setInputText(textToSend); // Restore text on error
    }
  };

  // =====================================================
  // CAMERA
  // =====================================================

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera');
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSendImage = async (imageUri: string) => {
    setIsUploading(true);

    try {
      // Compress and resize image before upload
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Resize if too large (max width 1200px)
          { resize: { width: 1200 } },
        ],
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const result = await sendMessage({
        bookingId,
        senderId: currentUserId,
        receiverId: otherUserId,
        imageUri: manipulatedImage.uri,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to send image');
      }
    } catch (error) {
      console.error('Image compression error:', error);
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  // =====================================================
  // RENDER MESSAGE
  // =====================================================

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUserId;
    const messageTime = new Date(item.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {/* Image message */}
        {item.image_url && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedImageUrl(item.image_url)}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Text message */}
        {item.message && (
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.message}
          </Text>
        )}

        {/* Timestamp */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {messageTime}
          </Text>
          {isOwnMessage && item.read_at && (
            <Ionicons 
              name="checkmark-done" 
              size={14} 
              color={Colors.white} 
              style={{ marginLeft: 4, opacity: 0.8 }} 
            />
          )}
        </View>
      </View>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerUser}>
          {otherUserAvatar ? (
            <Image source={{ uri: otherUserAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
              <Text style={styles.headerAvatarText}>
                {otherUserName ? otherUserName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <Text style={styles.headerName}>{otherUserName}</Text>
        </View>

        <View style={{ width: 24 }} />
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // Auto-scroll to bottom when content size changes
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            // Scroll to bottom on initial layout
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />
      )}

      {/* Upload Progress */}
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.uploadingText}>Sending photo...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={handleTakePhoto}
          style={styles.cameraButton}
          disabled={isUploading}
        >
          <Ionicons name="camera-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.text.tertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!isSending && !isUploading}
        />

        <TouchableOpacity
          onPress={handleSendMessage}
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          disabled={!inputText.trim() || isSending || isUploading}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={selectedImageUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerCloseArea}
            activeOpacity={1}
            onPress={() => setSelectedImageUrl(null)}
          >
            {selectedImageUrl && (
              <Image
                source={{ uri: selectedImageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.imageViewerCloseButton}
            onPress={() => setSelectedImageUrl(null)}
          >
            <Ionicons name="close" size={30} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  headerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray[100],
  },
  messageText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.white,
  },
  otherMessageText: {
    color: Colors.text.primary,
  },
  messageTime: {
    fontSize: Typography.fontSize.xs,
  },
  ownMessageTime: {
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.text.tertiary,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    gap: Spacing.sm,
  },
  uploadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryText,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.sm,
  },
  cameraButton: {
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    paddingTop: Platform.OS === 'android' ? Spacing.sm : undefined,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: Spacing.xl + 40, // Account for status bar
    right: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    zIndex: 10,
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
