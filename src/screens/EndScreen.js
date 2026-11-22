import React, { useCallback, useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, RoleIcon, Screen, SectionLabel, Sheet, TeamTag, haptic, s, toast, useBack } from '../ui';
import { useApp } from '../store';
import { colors, TEAMS } from '../theme';
import { roleById } from '../roles';
import { CAUSE_LABEL } from '../logic';

export default function EndScreen() {
  const { game, setup, customRoles, settings, actions } = useApp();
  const [saveOpen, setSaveOpen] = useState(false);
  const [groupName, setGroupName] = useState('');

  const goHome = useCallback(() => { actions.clearGame(); actions.resetTo('home'); }, [actions]);
  useBack(() => { goHome(); return true; });

  useEffect(() => {
    if (!game) actions.resetTo('home');
  }, [game, actions]);
  if (!game) return null;

  const winner = game.winner;
  const teamColor = winner ? (TEAMS[winner.team] || TEAMS.town).color : colors.muted;
  const winIds = new Set(winner ? winner.playerIds || [] : []);

  const doSave = () => {
    const res = actions.saveGroup(groupName, { includeRoles: true });
    setSaveOpen(false);
    toast(res === 'updated' ? 'Group updated' : 'Group saved');
  };

  const footer = (
    <>
      <Button variant="primary" icon="🔁" title="Play again" onPress={() => { actions.reshuffle(); haptic(settings, 'success'); actions.replace('reveal'); }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button style={{ flex: 1 }} variant="ghost" icon="🔖" title="Save group" onPress={() => { setGroupName(''); setSaveOpen(true); }} />
        <Button style={{ flex: 1 }} variant="ghost" icon="🏠" title="Home" onPress={goHome} />
      </View>
    </>
  );

  return (
    <Screen title="Game Over" footer={footer}>
      <Card color={teamColor} style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
        <Text style={{ fontSize: 48 }}>{winner ? (winner.team === 'town' ? '🏆' : winner.team === 'mafia' ? '🔪' : winner.team === 'werewolf' ? '🐺' : '🎭') : '🏁'}</Text>
        <Text style={{ color: teamColor, fontSize: 28, fontWeight: '900', textAlign: 'center' }}>{winner ? winner.title : 'Game ended'}</Text>
        <Text style={s.muted}>{winner ? winner.detail : 'The game was ended without a winner.'}</Text>
      </Card>

      <SectionLabel>ALL PLAYERS</SectionLabel>
      {game.players.map((p) => {
        const role = roleById(p.roleId, customRoles);
        const won = winIds.has(p.id);
        const target = p.targetId ? game.players.find((x) => x.id === p.targetId) : null;
        return (
          <Card key={p.id} color={won ? colors.gold : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, opacity: p.alive || won ? 1 : 0.8 }}>
            <RoleIcon role={role} size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>{won ? '🏆 ' : ''}{p.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>{role.name}{target ? ` · target: ${target.name}` : ''}</Text>
              <Text style={{ color: p.alive ? colors.good : colors.dim, fontSize: 12 }}>
                {p.alive ? 'Survived' : `${CAUSE_LABEL[p.cause] || 'Eliminated'}`}
              </Text>
            </View>
            <TeamTag team={role.team} />
          </Card>
        );
      })}

      <Sheet visible={saveOpen} onClose={() => setSaveOpen(false)} title="Save this group" desc="Saves the player names and role setup for next time.">
        <View style={{ gap: 12 }}>
          <TextInput
            style={s.input}
            value={groupName}
            onChangeText={setGroupName}
            placeholder={`Group of ${setup.names.length || game.players.length}`}
            placeholderTextColor={colors.dim}
            maxLength={40}
          />
          <Button variant="primary" title="Save" onPress={doSave} />
          <Button variant="ghost" title="Cancel" onPress={() => setSaveOpen(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}
