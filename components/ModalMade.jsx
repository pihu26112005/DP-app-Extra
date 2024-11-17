import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

export default function EmojiPicker({ isVisible, children, onClose }) {
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View className="h-1/2 w-full bg-gray-800 rounded-t-lg absolute bottom-0">
          <Text >Choose a modal</Text>
          <Pressable onPress={onClose}>
            <Text>Hello</Text>
          {children}
          <Text>World</Text>
          </Pressable>
        </View>
    </Modal>
  );
}
