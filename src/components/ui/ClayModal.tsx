import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { useAppTheme } from '@/theme';
import { GlassContainer } from './GlassContainer';
import { GlassSurface } from './GlassSurface';

export interface ClayModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function ClayModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: ClayModalProps) {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrapper}
      >
        <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
          <Pressable
            style={styles.backdropDismiss}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar janela modal"
          />

          <View
            style={[
              styles.sheet,
              theme.shadows.lg,
              {
                backgroundColor: theme.colors.background,
                borderTopLeftRadius: theme.radii.xxl,
                borderTopRightRadius: theme.radii.xxl,
                borderTopColor: theme.colors.clayHighlight,
              },
            ]}
          >
            <View style={styles.handlePill} />

            <View style={styles.headerRow}>
              <View style={styles.titleBlock}>
                <Text
                  style={[
                    theme.typography.h2,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={[
                      theme.typography.bodySmall,
                      { color: theme.colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {isLiquidGlass ? (
                <GlassContainer spacing={8}>
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                  >
                    <GlassSurface
                      interactive
                      tintColor="rgba(122, 90, 248, 0.16)"
                      borderRadius={theme.radii.pill}
                      style={styles.closeGlassBtn}
                    >
                      <X size={20} color="#1E1633" strokeWidth={2.4} />
                    </GlassSurface>
                  </Pressable>
                </GlassContainer>
              ) : (
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radii.pill,
                    },
                  ]}
                >
                  <X size={20} color={theme.colors.textPrimary} />
                </Pressable>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollBody}
            >
              {children}
            </ScrollView>

            {footer ? <View style={styles.footerSlot}>{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 3,
  },
  handlePill: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(138, 111, 232, 0.25)',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(138, 111, 232, 0.16)',
  },
  closeGlassBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingBottom: 12,
  },
  footerSlot: {
    paddingTop: 12,
  },
});
