import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen, Button, Card, SectionLabel, Toggle, formatTime, s } from '../ui';
import { colors } from '../theme';
import { useApp, DEFAULT_SETTINGS } from '../store';

function TimeRow({ label, hint, value, step, min, max, onChange, plain }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const btn = (txt, d, off) => (
    <Pressable onPress={() => onChange(clamp(value + d))} hitSlop={4} style={{
      width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.3 : 1,
    }}>
      <Text style={{ color: colors.text, fontSize: 22 }}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
      <View style={{ flex: 1 }}>
        <Text style={[s.text, { fontWeight: '600' }]}>{label}</Text>
        {hint ? <Text style={{ color: colors.dim, fontSize: 12 }}>{hint}</Text> : null}
      </View>
      {btn('−', -step, value <= min)}
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, minWidth: 48, textAlign: 'center' }}>
        {plain ? `${value}s` : formatTime(value)}
      </Text>
      {btn('+', step, value >= max)}
    </View>
  );
}

function ToggleRow({ label, hint, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <Text style={[s.text, { fontWeight: '600' }]}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{hint}</Text>
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, actions } = useApp();
  const set = (k) => (v) => actions.updateSettings({ [k]: v });
  return (
    <Screen title="Settings" onBack={actions.goBack}>
      <SectionLabel>TIMERS</SectionLabel>
      <Card>
        <TimeRow label="Discussion" value={settings.discussion} step={15} min={15} max={900} onChange={set('discussion')} />
        <TimeRow label="Defense" value={settings.defense} step={5} min={5} max={300} onChange={set('defense')} />
        <TimeRow label="Voting" value={settings.voting} step={5} min={10} max={300} onChange={set('voting')} />
        <TimeRow label="Night action" hint="Time each role gets in the narration" plain
          value={settings.nightAction} step={1} min={3} max={60} onChange={set('nightAction')} />
      </Card>
      <SectionLabel>GAMEPLAY</SectionLabel>
      <Card>
        <ToggleRow label="Narrator voice" hint="Read the night script aloud" value={settings.narrator} onChange={set('narrator')} />
        <ToggleRow label="Reveal role on elimination" hint="Show a player's role when they are out" value={settings.revealOnDeath} onChange={set('revealOnDeath')} />
        <ToggleRow label="Killers see their teammates" hint="Shown on Mafia and Werewolf role cards" value={settings.showTeammates} onChange={set('showTeammates')} />
        <ToggleRow label="Vibration" hint="Haptic feedback on taps" value={settings.haptics} onChange={set('haptics')} />
      </Card>
      <Button title="Reset to defaults" variant="ghost" onPress={() => actions.updateSettings({ ...DEFAULT_SETTINGS })} />
    </Screen>
  );
}
