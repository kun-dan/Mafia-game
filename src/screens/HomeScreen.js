import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Screen } from '../ui';
import { useApp } from '../store';
import { colors } from '../theme';

function Moon() {
  return (
    <View style={st.moonWrap}>
      <View style={st.glow3} />
      <View style={st.glow2} />
      <View style={st.glow1} />
      <View style={st.moon} />
      <View style={st.bite} />
      <Text style={st.star1}>✦</Text>
      <Text style={st.star2}>✦</Text>
      <Text style={st.star3}>·</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { game, savedGroups, actions } = useApp();
  const canResume = game && !game.over;
  const resume = () => {
    const allRevealed = game.revealed && game.revealed.every(Boolean);
    actions.navigate(allRevealed ? 'game' : 'reveal');
  };
  return (
    <Screen contentStyle={st.body}>
      <View style={st.hero}>
        <Moon />
        <Text style={st.title}>MIDNIGHT</Text>
        <Text style={[st.title, { color: colors.accent, marginTop: -6 }]}>MAFIA</Text>
        <Text style={st.tag}>Pass the phone. Trust no one.</Text>
      </View>
      <View style={st.btns}>
        <Button title="Start New Game" icon="🌙" variant="primary" onPress={() => actions.navigate('count')} />
        {canResume ? <Button title="Resume Game" icon="▶" variant="gold" onPress={resume} /> : null}
        <Button
          title={savedGroups.length ? `Saved Groups  (${savedGroups.length})` : 'Saved Groups'}
          icon="🔖"
          onPress={() => actions.navigate('groups')}
        />
        <Button title="Custom Roles" icon="🎭" onPress={() => actions.navigate('customRoles')} />
        <Button title="How to Play" icon="📖" onPress={() => actions.navigate('howto')} />
        <Button title="Settings" icon="⚙️" onPress={() => actions.navigate('settings')} />
      </View>
      <Text style={st.version}>v1.0.0</Text>
    </Screen>
  );
}

const M = 120;
const st = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 24 },
  hero: { alignItems: 'center', gap: 4 },
  moonWrap: { width: 220, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  glow3: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.gold, opacity: 0.05 },
  glow2: { position: 'absolute', width: 164, height: 164, borderRadius: 82, backgroundColor: colors.gold, opacity: 0.08 },
  glow1: { position: 'absolute', width: 134, height: 134, borderRadius: 67, backgroundColor: colors.gold, opacity: 0.14 },
  moon: { position: 'absolute', width: M, height: M, borderRadius: M / 2, backgroundColor: colors.gold },
  bite: { position: 'absolute', width: M * 0.85, height: M * 0.85, borderRadius: M * 0.425, backgroundColor: colors.bg, left: 220 / 2 - 8, top: 200 / 2 - M * 0.5 - 6 },
  star1: { position: 'absolute', top: 14, right: 22, color: colors.gold, fontSize: 18 },
  star2: { position: 'absolute', bottom: 22, right: 40, color: colors.text, fontSize: 12, opacity: 0.7 },
  star3: { position: 'absolute', top: 40, left: 20, color: colors.text, fontSize: 30, opacity: 0.6 },
  title: { color: colors.text, fontSize: 44, fontWeight: '900', letterSpacing: 8 },
  tag: { color: colors.muted, fontSize: 15, fontStyle: 'italic', marginTop: 10, letterSpacing: 0.5 },
  btns: { gap: 12 },
  version: { color: colors.dim, fontSize: 12, textAlign: 'center' },
});
