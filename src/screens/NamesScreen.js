import React, { useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Heading, Screen, Sheet, s, toast } from '../ui';
import { useApp } from '../store';
import { colors } from '../theme';
import SetupSteps from './SetupSteps';

export default function NamesScreen() {
  const { setup, savedGroups, actions } = useApp();
  const count = setup.count || 0;
  const names = Array.from({ length: count }, (_, i) => setup.names[i] || '');
  const refs = useRef([]);
  const [loadSheet, setLoadSheet] = useState(false);
  const [saveSheet, setSaveSheet] = useState(false);
  const [groupName, setGroupName] = useState('');

  const dupes = useMemo(() => {
    const seen = {};
    names.forEach((n) => { const k = n.trim().toLowerCase(); if (k) seen[k] = (seen[k] || 0) + 1; });
    return new Set(Object.keys(seen).filter((k) => seen[k] > 1));
  }, [setup.names, count]);
  const filled = names.filter((n) => n.trim()).length;

  const openSave = () => {
    // Suggest the name of a loaded group (same names), else "Group of N".
    const sig = names.map((n) => n.trim()).join('|');
    const match = savedGroups.find((g) => g.names.join('|') === sig);
    setGroupName(match ? match.name : `Group of ${count}`);
    setSaveSheet(true);
  };
  const doSave = () => {
    const res = actions.saveGroup(groupName);
    setSaveSheet(false);
    toast(res === 'updated' ? 'Group updated' : 'Group saved');
  };
  const next = () => {
    if (dupes.size) { toast('Each name must be unique'); return; }
    actions.navigate('roles');
  };

  return (
    <Screen
      title="Game Setup"
      onBack={actions.goBack}
      footer={<Button title="Next: Roles" variant="primary" onPress={next} />}
    >
      <SetupSteps step={1} />
      <Heading title="Who's playing?" subtitle="Each name must be unique" />
      <View style={{ gap: 6 }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.card2, overflow: 'hidden' }}>
          <View style={{ height: 8, width: `${count ? (filled / count) * 100 : 0}%`, backgroundColor: colors.accent }} />
        </View>
        <Text style={[s.muted, { fontSize: 12 }]}>{filled} / {count} names entered</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {savedGroups.length > 0 && <Button small style={{ flex: 1 }} title="Load group" icon="📂" onPress={() => setLoadSheet(true)} />}
        <Button small style={{ flex: 1 }} title="Save group" icon="🔖" onPress={openSave} />
      </View>
      {names.map((n, i) => {
        const dup = dupes.has(n.trim().toLowerCase()) && n.trim();
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.muted, fontWeight: '800' }}>{i + 1}</Text>
            </View>
            <TextInput
              ref={(r) => { refs.current[i] = r; }}
              style={[s.input, { flex: 1, minHeight: 48 }, dup && { borderColor: colors.accent, borderWidth: 2 }]}
              placeholder={`Player ${i + 1}`}
              placeholderTextColor={colors.dim}
              value={n}
              onChangeText={(t) => actions.setName(i, t)}
              returnKeyType={i === count - 1 ? 'done' : 'next'}
              blurOnSubmit={i === count - 1}
              onSubmitEditing={() => { if (i < count - 1) refs.current[i + 1]?.focus(); }}
              autoCapitalize="words"
              maxLength={20}
            />
          </View>
        );
      })}
      <Sheet visible={loadSheet} onClose={() => setLoadSheet(false)} title="Load group">
        <View style={{ gap: 10 }}>
          {savedGroups.map((g) => (
            <Card key={g.id} onPress={() => { setLoadSheet(false); actions.loadGroup(g.id); }}>
              <Text style={s.text}>{g.name} · {g.names.length} players</Text>
              <Text style={[s.muted, { textAlign: 'left', marginTop: 4 }]} numberOfLines={2}>
                {g.names.slice(0, 5).join(', ')}{g.names.length > 5 ? '…' : ''}
              </Text>
            </Card>
          ))}
        </View>
      </Sheet>
      <Sheet visible={saveSheet} onClose={() => setSaveSheet(false)} title="Save group" desc="Saving with an existing name updates that group.">
        <TextInput
          style={s.input}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Group name"
          placeholderTextColor={colors.dim}
          maxLength={30}
          autoFocus
        />
        <Button title="Save" variant="primary" style={{ marginTop: 14 }} onPress={doSave} />
      </Sheet>
    </Screen>
  );
}
