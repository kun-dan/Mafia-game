import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Button, Card, Screen, Sheet, TeamTag, haptic, s, useBack } from '../ui';
import { useApp } from '../store';
import { colors, TEAMS } from '../theme';
import { roleById } from '../roles';
import { intelFor } from '../logic';

const HOLD_MS = 600;

function HoldButton({ title, onComplete }) {
  const fill = useRef(new Animated.Value(0)).current;
  const onPressIn = () => {
    fill.setValue(0);
    Animated.timing(fill, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start();
  };
  const onPressOut = () => {
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };
  return (
    <View>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={onComplete}
        delayLongPress={HOLD_MS}
        style={{
          minHeight: 64, borderRadius: 18, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.card,
          overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
        }}
      >
        <Animated.View
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.accent2,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
      </Pressable>
      <Text style={[s.muted, { marginTop: 8 }]}>Press and hold</Text>
    </View>
  );
}

function RoleCard({ role, lines }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start();
  }, [anim]);
  const team = TEAMS[role.team] || TEAMS.town;
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }, { scaleX: anim }],
      }}
    >
      <Card color={team.color} style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
        <Text style={{ fontSize: 76 }}>{role.icon}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 3 }}>YOU ARE</Text>
        <Text style={{ color: team.color, fontSize: 34, fontWeight: '900', textAlign: 'center' }}>{role.name}</Text>
        <TeamTag team={role.team} />
        <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 4 }}>{role.desc}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>Goal: {team.goal}</Text>
        {lines.length > 0 && (
          <View style={{ alignSelf: 'stretch', backgroundColor: colors.gold + '22', borderColor: colors.gold, borderWidth: 1, borderRadius: 14, padding: 12, gap: 6, marginTop: 6 }}>
            {lines.map((l, i) => <Text key={i} style={{ color: colors.gold, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{l}</Text>)}
          </View>
        )}
      </Card>
      <Text style={{ color: colors.danger, textAlign: 'center', marginTop: 14, fontSize: 14, fontWeight: '600' }}>
        Memorize your role — you can't check again.
      </Text>
    </Animated.View>
  );
}

export default function RevealScreen() {
  const { game, customRoles, settings, actions } = useApp();
  const [active, setActive] = useState(null); // { index, stage: 'pass' | 'card' }
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [reshuffleOpen, setReshuffleOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const onBack = useCallback(() => {
    if (active) setActive(null);
    else setLeaveOpen(true);
    return true;
  }, [active]);
  useBack(onBack);

  useEffect(() => {
    if (!game) actions.resetTo('home');
  }, [game, actions]);
  if (!game) return null;

  const total = game.players.length;
  const done = game.revealed.filter(Boolean).length;
  const allDone = done === total;

  if (active) {
    const player = game.players[active.index];
    const role = roleById(player.roleId, customRoles);
    if (active.stage === 'pass') {
      return (
        <Screen scroll={false} contentStyle={{ justifyContent: 'center', gap: 22 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 60 }}>📱</Text>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' }}>Pass the phone to {player.name}</Text>
            <Text style={s.muted}>Only {player.name} should look.</Text>
          </View>
          <HoldButton
            title={`I'm ${player.name} — show my role`}
            onComplete={() => { haptic(settings, 'heavy'); setActive({ index: active.index, stage: 'card' }); }}
          />
          <Button title="Cancel" variant="ghost" onPress={() => setActive(null)} />
        </Screen>
      );
    }
    return (
      <Screen
        footer={<Button variant="primary" title="Got it — hide my role" onPress={() => { actions.markRevealed(active.index); haptic(settings, 'success'); setActive(null); }} />}
      >
        <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 15 }}>{player.name}</Text>
        <RoleCard role={role} lines={intelFor(game, player.id, customRoles, settings)} />
      </Screen>
    );
  }

  const footer = (
    <>
      {allDone && <Button variant="gold" icon="🌙" title="Start the Night" onPress={() => actions.replace('game')} />}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {done === 0 && <Button style={{ flex: 1 }} variant="ghost" icon="🔀" title="Reshuffle" onPress={() => setReshuffleOpen(true)} />}
        <Button style={{ flex: 1 }} variant="danger" title="New Game" onPress={() => setNewOpen(true)} />
      </View>
    </>
  );

  return (
    <Screen title="Reveal Roles" onBack={() => setLeaveOpen(true)} footer={footer}>
      <View>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginBottom: 6 }}>{done} / {total} revealed</Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' }}>
          <View style={{ height: 8, width: `${(done / total) * 100}%`, backgroundColor: allDone ? colors.good : colors.accent }} />
        </View>
        <Text style={[s.muted, { marginTop: 8 }]}>{allDone ? 'Everyone knows their role.' : 'Tap your name, then pass the phone.'}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {game.players.map((p, i) => {
          const seen = game.revealed[i];
          return (
            <Pressable
              key={p.id}
              disabled={seen}
              onPress={() => { haptic(settings); setActive({ index: i, stage: 'pass' }); }}
              style={({ pressed }) => ({
                width: '31.5%', minHeight: 92, borderRadius: 16, borderWidth: 1, borderColor: seen ? colors.line : colors.accent2,
                backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6,
                opacity: seen ? 0.4 : pressed ? 0.75 : 1,
              })}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: seen ? colors.good + '33' : colors.accent + '33', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: seen ? colors.good : colors.text, fontWeight: '900', fontSize: seen ? 20 : 17 }}>
                  {seen ? '✓' : (p.name.trim()[0] || '?').toUpperCase()}
                </Text>
              </View>
              <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{p.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Sheet visible={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave role reveal?" desc="You will go back to role setup. The dealt roles stay as they are.">
        <View style={{ gap: 10 }}>
          <Button variant="primary" title="Leave" onPress={() => { setLeaveOpen(false); actions.goBack(); }} />
          <Button variant="ghost" title="Stay" onPress={() => setLeaveOpen(false)} />
        </View>
      </Sheet>
      <Sheet visible={reshuffleOpen} onClose={() => setReshuffleOpen(false)} title="Reshuffle roles?" desc="Everyone gets a new random role.">
        <View style={{ gap: 10 }}>
          <Button variant="primary" title="Reshuffle" onPress={() => { setReshuffleOpen(false); actions.reshuffle(); haptic(settings, 'success'); }} />
          <Button variant="ghost" title="Cancel" onPress={() => setReshuffleOpen(false)} />
        </View>
      </Sheet>
      <Sheet visible={newOpen} onClose={() => setNewOpen(false)} title="Start a new game?" desc="The current game will be discarded.">
        <View style={{ gap: 10 }}>
          <Button variant="primary" title="New Game" onPress={() => { setNewOpen(false); actions.clearGame(); actions.resetTo('home'); }} />
          <Button variant="ghost" title="Cancel" onPress={() => setNewOpen(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}
