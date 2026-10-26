import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { useAppTheme } from '@/theme';
import { GlassContainer } from './GlassContainer';
import { GlassSurface } from './GlassSurface';

/**
 * Seção temporária de teste (visível apenas em `__DEV__`) para validar
 * `useLiquidGlass`, `GlassSurface` e `GlassContainer` sobre fundo colorido no iPhone.
 * TODO: Remover ao fim da Fase 3 conforme `docs/ios-regras.md` / plano de fases.
 */
export function LiquidGlassDevPreview() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const [tapCount, setTapCount] = useState(0);

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#7E61E3', '#F07167', '#44B988', '#72B7F9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.colorfulBackdrop, { borderRadius: theme.radii.xl }]}
      >
        {/* Formas coloridas de alto contraste no fundo para evidenciar a refração do Liquid Glass */}
        <View style={[styles.ColorBlob, styles.blobTopRight]} />
        <View style={[styles.ColorBlob, styles.blobBottomLeft]} />

        <View style={styles.headerRow}>
          <Sparkles size={15} color="#FFFFFF" />
          <Text style={[theme.typography.caption, styles.badgeText]}>
            DEV • Fase 1 Liquid Glass ({Platform.OS} {String(Platform.Version)})
          </Text>
        </View>

        <Text style={[theme.typography.bodySmall, styles.statusLine]}>
          useLiquidGlass():{' '}
          <Text style={{ fontFamily: theme.fontFamilies.extraBold }}>
            {isLiquidGlass
              ? 'ATIVO (UIVisualEffectView iOS 26+)'
              : 'FALLBACK CLAY (iOS < 26 / Android / Web)'}
          </Text>
        </Text>

        <GlassContainer spacing={12} style={styles.glassRow}>
          <Pressable
            onPress={() => setTapCount((c) => c + 1)}
            style={styles.flexItem}
            accessibilityRole="button"
            accessibilityLabel="Testar toque no GlassSurface interativo"
          >
            <GlassSurface
              interactive
              borderRadius={theme.radii.lg}
              style={styles.surfaceBox}
            >
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Glass Regular • Interactive
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                Toques: {tapCount}
              </Text>
            </GlassSurface>
          </Pressable>

          <GlassSurface
            interactive
            tintColor="rgba(138, 111, 232, 0.28)"
            borderRadius={theme.radii.lg}
            style={[styles.surfaceBox, styles.flexItem]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textPrimary },
              ]}
            >
              Glass + Tint Lilás
            </Text>
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
            >
              borderRadius={theme.radii.lg}
            </Text>
          </GlassSurface>
        </GlassContainer>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  colorfulBackdrop: {
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  ColorBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTopRight: {
    width: 110,
    height: 110,
    right: -15,
    top: -20,
    backgroundColor: 'rgba(255, 230, 109, 0.55)',
  },
  blobBottomLeft: {
    width: 90,
    height: 90,
    left: 20,
    bottom: -25,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    marginLeft: 6,
  },
  statusLine: {
    color: '#FFFFFF',
    marginBottom: 10,
  },
  glassRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexItem: {
    flex: 1,
  },
  surfaceBox: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});
