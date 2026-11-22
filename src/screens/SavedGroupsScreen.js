import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Screen, Button, Card, Sheet, toast, s } from '../ui';
import { colors } from '../theme';
import { useApp } from '../store';

function shortDate(ts) {
  if (!ts) return '';
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString();
}

export default function SavedGroupsScreen() {
  const { savedGroups, actions } = useApp();
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState('');
  const [deleting, setDeleting] = useState(null);
  const groups = [...savedGroups].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

  return (
    <Screen title="Saved Groups" onBack={actions.goBack}>
      {groups.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 28 }}>
          <Text style={{ fontSize: 40 }}>🔖</Text>
          <Text style={[s.muted, { fontSize: 15 }]}>No saved groups yet — save one from the Names or Roles step.</Text>
          <Button title="Start New Game" variant="primary" onPress={() => actions.navigate('count')} />
        </Card>
      ) : groups.map((g) => (
        <Card key={g.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={[s.text, { fontWeight: '800', fontSize: 18, flex: 1 }]} numberOfLines={1}>{g.name}</Text>
            <Text style={{ color: colors.dim, fontSize: 12 }}>{shortDate(g.savedAt)}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {g.names.length} players{g.roleCounts ? ' • roles saved' : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {g.names.map((n, i) => (
              <View key={i} style={{ backgroundColor: colors.card2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: colors.text, fontSize: 13 }}>{n}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button small variant="primary" title="Play" icon="▶" onPress={() => { actions.loadGroup(g.id); actions.navigate('names'); }} />
            <Button small variant="ghost" title="Rename" icon="✏️" onPress={() => { setRenaming(g); setNewName(g.name); }} />
            <Button small variant="danger" title="Delete" icon="🗑" onPress={() => setDeleting(g)} />
          </View>
        </Card>
      ))}

      <Sheet visible={!!renaming} onClose={() => setRenaming(null)} title="Rename group">
        <TextInput
          style={s.input} value={newName} onChangeText={setNewName} maxLength={30}
          placeholder="Group name" placeholderTextColor={colors.dim} autoFocus
        />
        <View style={{ height: 12 }} />
        <Button title="Save" variant="primary" disabled={!newName.trim()} onPress={() => {
          actions.renameGroup(renaming.id, newName);
          setRenaming(null);
          toast('Group renamed');
        }} />
      </Sheet>

      <Sheet
        visible={!!deleting} onClose={() => setDeleting(null)} title="Delete group?"
        desc={deleting ? `"${deleting.name}" will be removed. This can't be undone.` : ''}
      >
        <View style={{ gap: 10 }}>
          <Button title="Delete" variant="danger" onPress={() => {
            actions.deleteGroup(deleting.id);
            setDeleting(null);
            toast('Group deleted');
          }} />
          <Button title="Cancel" variant="ghost" onPress={() => setDeleting(null)} />
        </View>
      </Sheet>
    </Screen>
  );
}
