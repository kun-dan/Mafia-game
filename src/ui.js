// Shared UI building blocks. Screens should compose these instead of re-styling basics.
import React, { useEffect } from 'react';
import {
  BackHandler, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, TEAMS } from './theme';

/** Run `handler` on the Android back button while `active`. Return true from handler to consume. */
export function useBack(handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [handler, active]);
}

export function toast(message) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else console.log('[toast]', message);
}

/** Light haptic feedback; pass settings so the user's toggle is respected. */
export function haptic(settings, kind = 'light') {
  if (settings && settings.haptics === false) return;
  const map = {
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  };
  (map[kind] || map.light)().catch(() => {});
}

/**
 * Standard screen: safe-area aware, optional top bar with back button, scrollable body,
 * optional footer pinned to the bottom.
 */
export function Screen({ title, onBack, right, children, scroll = true, footer, contentStyle }) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <View style={[s.screen, { paddingTop: insets.top + 8 }]}>
      {(title !== undefined || onBack) && (
        <View style={s.topbar}>
          {onBack ? <IconButton icon="‹" onPress={onBack} big /> : <View style={s.spacer} />}
          <Text style={s.topTitle} numberOfLines={1}>{title}</Text>
          {right || <View style={s.spacer} />}
        </View>
      )}
      <Body
        style={{ flex: 1 }}
        contentContainerStyle={scroll ? [s.body, contentStyle] : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {scroll ? children : <View style={[s.body, { flex: 1 }, contentStyle]}>{children}</View>}
      </Body>
      {footer ? <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : <View style={{ height: insets.bottom }} />}
    </View>
  );
}

export function IconButton({ icon, onPress, big, style }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.iconBtn, pressed && s.pressed, style]} hitSlop={8}>
      <Text style={[s.iconBtnText, big && { fontSize: 30, marginTop: -4 }]}>{icon}</Text>
    </Pressable>
  );
}

/** variant: 'default' | 'primary' | 'gold' | 'ghost' | 'danger' */
export function Button({ title, icon, onPress, variant = 'default', small, disabled, style, textStyle }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall, { backgroundColor: v.bg, borderColor: v.border },
        disabled && { opacity: 0.4 }, pressed && s.pressed, style,
      ]}
    >
      {icon ? <Text style={[s.btnIcon, small && { fontSize: 15 }]}>{icon}</Text> : null}
      <Text style={[s.btnText, small && { fontSize: 14 }, { color: v.color }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const VARIANTS = {
  default: { bg: colors.card, border: colors.line, color: colors.text },
  primary: { bg: colors.accent, border: colors.accent, color: '#fff' },
  gold: { bg: colors.gold, border: colors.gold, color: '#1b1206' },
  ghost: { bg: 'transparent', border: colors.line, color: colors.text },
  danger: { bg: 'transparent', border: '#5b1a2b', color: colors.danger },
};

export function Card({ children, style, onPress, color }) {
  const content = [s.card, color && { borderColor: color }, style];
  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [...content, pressed && s.pressed]}>{children}</Pressable>;
  }
  return <View style={content}>{children}</View>;
}

export function Heading({ title, subtitle, icon }) {
  return (
    <View style={s.heading}>
      {icon ? <Text style={s.headingIcon}>{icon}</Text> : null}
      <Text style={s.h2}>{title}</Text>
      {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionLabel({ children, color }) {
  return (
    <View style={s.sectionLabel}>
      {color ? <View style={[s.dot, { backgroundColor: color }]} /> : null}
      <Text style={s.sectionLabelText}>{children}</Text>
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <View style={s.stepper}>
      <Pressable style={s.stepBtn} onPress={() => value > min && onChange(value - 1)} hitSlop={4}>
        <Text style={[s.stepBtnText, value <= min && { opacity: 0.3 }]}>−</Text>
      </Pressable>
      <Text style={s.stepValue}>{value}</Text>
      <Pressable style={s.stepBtn} onPress={() => value < max && onChange(value + 1)} hitSlop={4}>
        <Text style={[s.stepBtnText, value >= max && { opacity: 0.3 }]}>+</Text>
      </Pressable>
    </View>
  );
}

export function Toggle({ value, onChange }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={[s.toggle, value && { backgroundColor: colors.accent }]} hitSlop={6}>
      <View style={[s.knob, value && { left: 25 }]} />
    </Pressable>
  );
}

export function RoleIcon({ role, size = 48 }) {
  const c = TEAMS[role.team]?.color || colors.muted;
  return (
    <View style={[s.roleIcon, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: c + '2e' }]}>
      <Text style={{ fontSize: size * 0.54 }}>{role.icon}</Text>
    </View>
  );
}

export function TeamTag({ team }) {
  const t = TEAMS[team] || TEAMS.town;
  return (
    <View style={[s.tag, { backgroundColor: t.color + '33' }]}>
      <Text style={[s.tagText, { color: t.color }]}>{t.label.toUpperCase()}</Text>
    </View>
  );
}

/** Bottom sheet dialog. */
export function Sheet({ visible, onClose, title, desc, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={s.sheetBg} onPress={onClose}>
        <Pressable style={[s.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
          <View style={s.grabber} />
          {title ? <Text style={s.sheetTitle}>{title}</Text> : null}
          {desc ? <Text style={[s.muted, { marginBottom: 16 }]}>{desc}</Text> : null}
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function formatTime(totalSeconds) {
  const t = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(t / 60);
  const sec = t % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 12 },
  topTitle: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 19, fontWeight: '700' },
  spacer: { width: 44 },
  body: { padding: 16, paddingBottom: 32, gap: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { color: colors.text, fontSize: 20 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  btn: { minHeight: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnSmall: { minHeight: 40, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  btnIcon: { fontSize: 18 },
  btnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius, padding: 16 },
  heading: { alignItems: 'center', marginBottom: 8, gap: 6 },
  headingIcon: { fontSize: 44, marginBottom: 4 },
  h2: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  text: { color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 2 },
  sectionLabelText: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden' },
  stepBtn: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card2 },
  stepBtnText: { color: colors.text, fontSize: 20, fontWeight: '600' },
  stepValue: { width: 30, textAlign: 'center', color: colors.text, fontWeight: '800', fontSize: 17 },
  toggle: { width: 52, height: 30, borderRadius: 15, backgroundColor: colors.line },
  knob: { position: 'absolute', top: 3, left: 3, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  roleIcon: { alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start' },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sheetBg: { flex: 1, backgroundColor: 'rgba(5,3,10,0.72)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.line, padding: 18, maxHeight: '88%' },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: colors.text, fontSize: 21, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 12, color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
