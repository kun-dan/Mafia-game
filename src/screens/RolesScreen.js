import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Heading, RoleIcon, Screen, SectionLabel, Sheet, Stepper, s, toast } from '../ui';
import { useApp } from '../store';
import { colors, TEAMS, TEAM_ORDER } from '../theme';
import { allRoles } from '../roles';
import { suggestRoles, totalRoles, validateSetup } from '../logic';
import SetupSteps from './SetupSteps';

export default function RolesScreen() {
  const { setup, customRoles, actions } = useApp();
  const count = setup.count || 0;
  const counts = setup.roleCounts || {};
  const total = totalRoles(counts);
  const roles = allRoles(customRoles);
  const msg = validateSetup(count, counts, customRoles);
  const [sheet, setSheet] = useState(false);
  const [groupName, setGroupName] = useState('');

  const fill = () => {
    const others = total - (counts.villager || 0);
    const v = count - others;
    if (v < 0) { toast('Too many other roles to fill with Villagers'); return; }
    actions.setRoleCount('villager', v);
  };
  const start = () => { actions.startGame(); actions.navigate('reveal'); };
  const save = () => {
    const res = actions.saveGroup(groupName, { includeRoles: true });
    setSheet(false);
    toast(res === 'updated' ? 'Group updated' : 'Group saved');
  };

  const statusColor = total === count ? colors.good : total > count ? colors.accent : colors.muted;

  return (
    <Screen
      title="Game Setup"
      onBack={actions.goBack}
      footer={(
        <>
          {msg ? <Text style={{ color: colors.danger, textAlign: 'center', fontSize: 14 }}>{msg}</Text> : null}
          <Button title="Start Game" icon="🌙" variant="primary" disabled={!!msg} onPress={start} />
          <Button small variant="ghost" title="Save group with roles" icon="🔖" onPress={() => { setGroupName(`Group of ${count}`); setSheet(true); }} />
        </>
      )}
    >
      <SetupSteps step={2} />
      <Heading title="Assign Roles" subtitle={`Configure roles for ${count} players`} />
      <View style={{ alignItems: 'center' }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: statusColor, backgroundColor: statusColor + '22' }}>
          <Text style={{ color: statusColor, fontWeight: '800' }}>{total} / {count} roles</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button small style={{ flex: 1 }} title="Suggest" icon="✨" onPress={() => actions.setRoleCounts(suggestRoles(count))} />
        <Button small style={{ flex: 1 }} title="Fill w/ Villagers" icon="🧑‍🌾" onPress={fill} />
      </View>
      {TEAM_ORDER.map((team) => {
        const list = roles.filter((r) => r.team === team);
        if (!list.length) return null;
        const t = TEAMS[team];
        return (
          <View key={team} style={{ gap: 10 }}>
            <SectionLabel color={t.color}>{t.label.toUpperCase()}</SectionLabel>
            {list.map((r) => {
              const n = counts[r.id] || 0;
              return (
                <Card key={r.id} color={n > 0 ? t.color : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                  <RoleIcon role={r} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[s.text, { fontWeight: '800' }]}>{r.name}</Text>
                      {r.custom ? (
                        <View style={[s.tag, { backgroundColor: colors.gold + '33' }]}>
                          <Text style={[s.tagText, { color: colors.gold }]}>CUSTOM</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={3}>{r.desc}</Text>
                  </View>
                  <Stepper value={n} min={0} max={count} onChange={(v) => actions.setRoleCount(r.id, v)} />
                </Card>
              );
            })}
          </View>
        );
      })}
      <Button title="Create a custom role" icon="➕" variant="ghost" onPress={() => actions.navigate('editRole', {})} />
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Save group with roles" desc="Saves the player names and this role setup.">
        <TextInput style={s.input} value={groupName} onChangeText={setGroupName} placeholder="Group name" placeholderTextColor={colors.dim} maxLength={30} autoFocus />
        <Button title="Save" variant="primary" style={{ marginTop: 14 }} onPress={save} />
      </Sheet>
    </Screen>
  );
}
