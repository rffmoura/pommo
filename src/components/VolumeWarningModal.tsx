import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/theme';
import VolumeIcon3 from '../assets/svg/volume.svg';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.55;

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onNeverShow: () => void;
}

export function VolumeWarningModal({ visible, onDismiss, onNeverShow }: Props) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SHEET_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(() => setModalVisible(false));
    }
  }, [visible]);

  const dismiss = () => onDismiss();
  const neverShow = () => onNeverShow();

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 24 },
          { transform: [{ translateY: sheetTranslateY }] },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.iconContainer}>
          <VolumeIcon3 width={70} height={70} />
        </View>

        <Text style={styles.title}>O volume está baixo</Text>
        <Text style={styles.subtitle}>
          Aumente o volume para ouvir os alertas de término dos seus pomodoros!
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={dismiss} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>ENTENDI</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={neverShow} activeOpacity={0.7} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Não mostrar novamente</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a24',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.focusAccent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryBtn: {
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: COLORS.focusAccent,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
