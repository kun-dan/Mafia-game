import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, IconButton, Card, SectionLabel, RoleIcon, TeamTag, s } from '../ui';
import { colors } from '../theme';
import { BUILTIN_ROLES } from '../roles';
import { useApp } from '../store';

function RoleRow({ role, onPress, note }) {
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <RoleIcon role={role} size={46} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={[s.text, { fontWeight: '800' }]}>{role.name}</Text>
          <TeamTag team={role.team} />
        </View>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{role.desc}</Text>
        {note ? <Text style={{ color: colors.gold, fontSize: 12 }}>{note}</Text> : null}
      </View>
    </Card>
  );
}

export default function CustomRolesScreen() {
  const { customRoles, actions } = useApp();
  const [showBuiltin, setShowBuiltin] = useState(false);
  return (
    <Screen
      title="Custom Roles" onBack={actions.goBack}
      right={<IconButton icon="+" onPress={() => actions.navigate('editRole', {})} />}
    >
      <Text style={{ color: colors.muted, fontSize: 14 }}>
        Create your own roles. They appear in role setup alongside the built-ins, and night roles get their own narrator step.
      </Text>
      <SectionLabel>YOUR ROLES</SectionLabel>
      {customRoles.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 36 }}>🎭</Text>
          <Text style={s.muted}>No custom roles yet. Tap + to invent one.</Text>
        </Card>
      ) : customRoles.map((r) => (
        <RoleRow key={r.id} role={r} onPress={() => actions.navigate('editRole', { id: r.id })} note={r.wakes ? '🌙 Wakes at night' : null} />
      ))}
      <Card onPress={() => setShowBuiltin(!showBuiltin)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Text style={[s.text, { fontWeight: '700' }]}>Built-in roles ({BUILTIN_ROLES.length})</Text>
        <Text style={{ color: colors.muted, fontSize: 18 }}>{showBuiltin ? '▴' : '▾'}</Text>
      </Card>
      {showBuiltin && BUILTIN_ROLES.map((r) => <RoleRow key={r.id} role={r} />)}
    </Screen>
  );
}
