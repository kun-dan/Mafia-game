import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Screen, Button, Card, SectionLabel, RoleIcon, TeamTag, Toggle, Sheet, toast, s } from '../ui';
import { colors, TEAMS } from '../theme';
import { ICON_CHOICES, allRoles } from '../roles';
import { useApp } from '../store';

const TEAM_KEYS = ['town', 'mafia', 'werewolf', 'neutral'];

export default function EditRoleScreen({ params }) {
  const { customRoles, actions } = useApp();
  const existing = params && params.id ? customRoles.find((r) => r.id === params.id) : null;
  const [name, setName] = useState(existing?.name || '');
  const [icon, setIcon] = useState(existing?.icon || '🕵️');
  const [team, setTeam] = useState(existing?.team || 'town');
  const [desc, setDesc] = useState(existing?.desc || '');
  const [wakes, setWakes] = useState(!!existing?.wakes);
  const [nightText, setNightText] = useState(existing?.nightText || '');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    const n = name.trim();
    if (!n) return setError('Give your role a name.');
    const dup = allRoles(customRoles).some((r) => r.id !== existing?.id && r.name.trim().toLowerCase() === n.toLowerCase());
    if (dup) return setError('A role with that name already exists.');
    actions.saveCustomRole({
      id: existing?.id, name: n, icon: icon || '❔', team,
      desc: desc.trim() || 'A custom role.', wakes, nightText: wakes ? nightText.trim() : '',
    });
    toast('Role saved');
    actions.goBack();
  };

  const preview = { name: name.trim() || 'Role name', icon: icon || '❔', team };
  const ph = colors.dim;

  return (
    <Screen
      title={existing ? 'Edit Role' : 'New Role'} onBack={actions.goBack}
      footer={(
        <>
          <Button title="Save Role" variant="primary" onPress={save} />
          {existing ? <Button title="Delete Role" variant="danger" onPress={() => setConfirmDelete(true)} /> : null}
        </>
      )}
    >
      <Card color={TEAMS[team].color} style={{ flexDirection: 'row', gap: 12 }}>
        <RoleIcon role={preview} size={52} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={[s.text, { fontWeight: '800' }]}>{preview.name}</Text>
            <TeamTag team={team} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{desc.trim() || 'Description appears here.'}</Text>
          {wakes ? <Text style={{ color: colors.gold, fontSize: 12 }}>🌙 Wakes at night</Text> : null}
        </View>
      </Card>

      <SectionLabel>NAME</SectionLabel>
      <TextInput style={s.input} value={name} maxLength={24} placeholder="e.g. Witch" placeholderTextColor={ph}
        onChangeText={(t) => { setName(t); setError(''); }} />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <SectionLabel>ICON</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ICON_CHOICES.map((ic) => (
          <Pressable key={ic} onPress={() => setIcon(ic)} style={{
            width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.card, borderWidth: 2, borderColor: icon === ic ? colors.accent : colors.line,
          }}>
            <Text style={{ fontSize: 22 }}>{ic}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={s.input} value={icon} maxLength={4} placeholder="or type any emoji" placeholderTextColor={ph}
        onChangeText={setIcon} />

      <SectionLabel>TEAM</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TEAM_KEYS.map((k) => {
          const on = team === k;
          const c = TEAMS[k].color;
          return (
            <Pressable key={k} onPress={() => setTeam(k)} style={{
              minHeight: 44, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center',
              borderWidth: 2, borderColor: c, backgroundColor: on ? c : 'transparent',
            }}>
              <Text style={{ color: on ? '#10081a' : c, fontWeight: '800' }}>{TEAMS[k].label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        {TEAMS[team].goal} Roles on the Mafia or Werewolf team count as killers and count toward that team's win.
      </Text>

      <SectionLabel>DESCRIPTION</SectionLabel>
      <TextInput style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]} multiline value={desc} maxLength={220}
        placeholder="What does this role do?" placeholderTextColor={ph} onChangeText={setDesc} />
      <Text style={{ color: colors.dim, fontSize: 12, textAlign: 'right' }}>{desc.length}/220</Text>

      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={[s.text, { fontWeight: '700' }]}>Wakes up at night</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Gets its own step in the narrator script.</Text>
        </View>
        <Toggle value={wakes} onChange={setWakes} />
      </Card>
      {wakes ? (
        <>
          <SectionLabel>NIGHT INSTRUCTION</SectionLabel>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Said after "{name.trim() || 'Role'}, open your eyes."
          </Text>
          <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} multiline value={nightText} maxLength={200}
            placeholder="e.g. Point at a player to curse." placeholderTextColor={ph} onChangeText={setNightText} />
        </>
      ) : null}

      <Sheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete role?"
        desc={`"${existing?.name || ''}" will be removed from role setups.`}>
        <View style={{ gap: 10 }}>
          <Button title="Delete" variant="danger" onPress={() => {
            actions.deleteCustomRole(existing.id);
            setConfirmDelete(false);
            toast('Role deleted');
            actions.goBack();
          }} />
          <Button title="Cancel" variant="ghost" onPress={() => setConfirmDelete(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}
