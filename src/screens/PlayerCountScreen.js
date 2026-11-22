import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Heading, Screen, SectionLabel, Sheet, s } from '../ui';
import { useApp } from '../store';
import { colors } from '../theme';
import SetupSteps from './SetupSteps';

function NumBtn({ n, selected, small, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        st.num, small ? st.numSmall : st.numBig, selected && st.numOn, pressed && s.pressed,
      ]}
    >
      <Text style={[st.numText, small && { fontSize: 18 }, selected && { color: '#fff' }]}>{n}</Text>
    </Pressable>
  );
}

export default function PlayerCountScreen() {
  const { setup, savedGroups, actions } = useApp();
  const [sheet, setSheet] = useState(false);
  const pick = (n) => { actions.setCount(n); actions.navigate('names'); };
  const big = Array.from({ length: 9 }, (_, i) => i + 4);
  const more = Array.from({ length: 13 }, (_, i) => i + 13);
  return (
    <Screen title="Game Setup" onBack={actions.goBack}>
      <SetupSteps step={0} />
      <Heading title="How many players?" subtitle="Pick the number of people playing" />
      <View style={st.grid}>
        {big.map((n) => <NumBtn key={n} n={n} selected={setup.count === n} onPress={() => pick(n)} />)}
      </View>
      <SectionLabel>MORE PLAYERS</SectionLabel>
      <View style={st.gridSmall}>
        {more.map((n) => <NumBtn key={n} n={n} small selected={setup.count === n} onPress={() => pick(n)} />)}
      </View>
      {savedGroups.length > 0 && (
        <Button title="Use a saved group" icon="📂" style={{ marginTop: 12 }} onPress={() => setSheet(true)} />
      )}
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Saved groups" desc="Pick a group to load its players.">
        <View style={{ gap: 10 }}>
          {savedGroups.map((g) => (
            <Card key={g.id} onPress={() => { setSheet(false); actions.loadGroup(g.id); actions.navigate('names'); }}>
              <Text style={s.text}>{g.name} · {g.names.length} players</Text>
              <Text style={[s.muted, { textAlign: 'left', marginTop: 4 }]} numberOfLines={2}>
                {g.names.slice(0, 5).join(', ')}{g.names.length > 5 ? '…' : ''}
              </Text>
            </Card>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridSmall: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  num: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  numBig: { width: '31.5%', height: 72, borderRadius: 18, flexGrow: 1 },
  numSmall: { width: '18%', height: 52, borderRadius: 14, flexGrow: 1 },
  numOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  numText: { color: colors.text, fontSize: 26, fontWeight: '800' },
});
