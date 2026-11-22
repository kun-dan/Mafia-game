import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { useKeepAwake } from 'expo-keep-awake';
import {
  Button, Card, IconButton, RoleIcon, Screen, SectionLabel, Sheet, Stepper, TeamTag, formatTime, haptic, toast, useBack,
} from '../ui';
import { useApp } from '../store';
import { colors, TEAMS } from '../theme';
import { roleById } from '../roles';
import { CAUSE_LABEL, nightSteps } from '../logic';

const NIGHT_CAUSES = [
  { id: 'night', label: 'Killed at night' },
  { id: 'arrest', label: 'Arrested' },
  { id: 'heartbreak', label: 'Died of heartbreak' },
];

const TAB_DEFS = {
  discussion: { label: 'Discussion', chips: [60, 120, 180, 300, 480] },
  defense: { label: 'Defense', chips: [15, 30, 45, 60] },
  voting: { label: 'Voting', chips: [30, 60, 90, 120] },
};
const TAB_ORDER = ['discussion', 'defense', 'voting'];

function chipLabel(sec) {
  return sec >= 60 && sec % 60 === 0 ? `${sec / 60}m` : `${sec}s`;
}

function say(text, onEnd) {
  // Resolves when speech finishes. Falls back to a timer if the engine never reports back.
  let finished = false;
  const done = () => { if (!finished) { finished = true; onEnd(); } };
  try {
    Speech.speak(text, { onDone: done, onStopped: done, onError: done });
  } catch (e) {
    done();
  }
  return setTimeout(done, 5000 + text.length * 150);
}

function Row({ children, style }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Day timers
// ---------------------------------------------------------------------------
function DayView({ game, settings, customRoles, actions, onResult }) {
  const [tab, setTab] = useState('discussion');
  const [timers, setTimersState] = useState(() => {
    const t = {};
    TAB_ORDER.forEach((k) => { t[k] = { total: settings[k], left: settings[k], endAt: null }; });
    return t;
  });
  const timersRef = useRef(timers);
  const setTimers = (next) => { timersRef.current = next; setTimersState(next); };
  const [votes, setVotes] = useState({});
  const [pick, setPick] = useState(null); // player for the action sheet
  const [confirmVote, setConfirmVote] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const iv = setInterval(() => {
      const cur = timersRef.current;
      if (!TAB_ORDER.some((k) => cur[k].endAt)) return;
      const now = Date.now();
      const next = { ...cur };
      const fired = [];
      TAB_ORDER.forEach((k) => {
        const t = cur[k];
        if (!t.endAt) return;
        const left = (t.endAt - now) / 1000;
        if (left <= 0) { next[k] = { ...t, left: 0, endAt: null }; fired.push(k); } else next[k] = { ...t, left };
      });
      timersRef.current = next;
      setTimersState(next);
      if (fired.length) {
        haptic(settingsRef.current, 'warning');
        toast("Time's up!");
        if (settingsRef.current.narrator) { try { Speech.speak('Time is up'); } catch (e) { /* ignore */ } }
      }
    }, 250);
    return () => { clearInterval(iv); try { Speech.stop(); } catch (e) { /* ignore */ } };
  }, []);

  const patch = (k, f) => setTimers({ ...timersRef.current, [k]: { ...timersRef.current[k], ...f } });
  const t = timers[tab];
  const running = !!t.endAt;
  const toggle = () => {
    if (running) patch(tab, { endAt: null });
    else {
      const left = t.left <= 0 ? t.total : t.left;
      patch(tab, { left, endAt: Date.now() + left * 1000 });
    }
  };
  const reset = () => patch(tab, { left: t.total, endAt: null });
  const add30 = () => patch(tab, { total: t.total + 30, left: t.left + 30, endAt: t.endAt ? t.endAt + 30000 : null });
  const setChip = (sec) => patch(tab, { total: sec, left: sec, endAt: null });

  const low = t.left <= 10 && t.left > 0 && running;
  const over = t.left <= 0;
  const ringColor = over || low ? colors.accent : colors.gold;
  const frac = t.total > 0 ? Math.max(0, Math.min(1, t.left / t.total)) : 0;

  const alive = game.players.filter((p) => p.alive);
  const counts = alive.map((p) => votes[p.id] || 0);
  const maxVotes = Math.max(0, ...counts);
  const leaders = alive.filter((p) => (votes[p.id] || 0) === maxVotes);
  const leader = maxVotes > 0 && leaders.length === 1 ? leaders[0] : null;

  const doEliminate = (p, cause) => {
    const res = actions.eliminate(p.id, cause);
    setPick(null);
    setConfirmVote(false);
    setVotes({});
    onResult(res);
  };

  return (
    <>
      <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.line }}>
        {TAB_ORDER.map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === k ? colors.accent : 'transparent' }}>
            <Text style={{ color: tab === k ? '#fff' : colors.muted, fontWeight: '800', fontSize: 14 }}>{TAB_DEFS[k].label}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 22 }} color={over || low ? colors.accent : undefined}>
        <Text style={{ color: ringColor, fontSize: 76, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatTime(t.left)}</Text>
        <View style={{ alignSelf: 'stretch', height: 14, borderRadius: 7, backgroundColor: colors.line, overflow: 'hidden' }}>
          <View style={{ height: 14, width: `${frac * 100}%`, backgroundColor: ringColor }} />
        </View>
        {over ? <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 18 }}>Time's up!</Text>
          : low ? <Text style={{ color: colors.accent, fontWeight: '800' }}>Hurry up!</Text> : null}
        <Row style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {TAB_DEFS[tab].chips.map((c) => (
            <Pressable key={c} onPress={() => setChip(c)} style={{ minHeight: 40, minWidth: 52, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: t.total === c ? colors.gold : colors.line, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: t.total === c ? colors.gold : colors.text, fontWeight: '700' }}>{chipLabel(c)}</Text>
            </Pressable>
          ))}
        </Row>
        <Row style={{ alignSelf: 'stretch' }}>
          <Button style={{ flex: 2 }} variant={running ? 'default' : 'gold'} icon={running ? '⏸' : '▶'} title={running ? 'Pause' : 'Start'} onPress={toggle} />
          <Button style={{ flex: 1 }} variant="ghost" title="Reset" onPress={reset} />
          <Button style={{ flex: 1 }} variant="ghost" title="+30s" onPress={add30} />
        </Row>
      </Card>

      {tab === 'voting' ? (
        <>
          <SectionLabel>VOTE TALLY</SectionLabel>
          {alive.map((p) => {
            const lead = leader && leader.id === p.id;
            return (
              <Card key={p.id} color={lead ? colors.gold : undefined} style={{ padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{lead ? '👈 ' : ''}{p.name}</Text>
                <Stepper value={votes[p.id] || 0} onChange={(v) => setVotes({ ...votes, [p.id]: v })} />
              </Card>
            );
          })}
          <Button variant="primary" disabled={!leader} icon="🗳️" title={leader ? `Eliminate ${leader.name}` : 'Eliminate (need a unique top vote)'} onPress={() => setConfirmVote(true)} />
          <Button variant="ghost" title="No elimination today" onPress={() => { setVotes({}); toast('No one was eliminated.'); }} />
        </>
      ) : (
        <>
          <SectionLabel>PLAYERS — TAP TO ELIMINATE OR REVIVE</SectionLabel>
          <View style={{ gap: 8 }}>
            {game.players.map((p) => (
              <Card key={p.id} onPress={() => setPick(p)} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: p.alive ? 1 : 0.55 }}>
                <Text style={{ fontSize: 18 }}>{p.alive ? '🟢' : '💀'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{p.name}</Text>
                  {!p.alive && (
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {CAUSE_LABEL[p.cause] || 'Eliminated'}{settings.revealOnDeath ? ` · ${roleById(p.roleId, customRoles).name}` : ''}
                    </Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      <Sheet visible={!!pick} onClose={() => setPick(null)} title={pick ? pick.name : ''}>
        {pick && pick.alive ? (
          <View style={{ gap: 10 }}>
            <Button icon="🗳️" title="Voted out" onPress={() => doEliminate(pick, 'vote')} />
            <Button icon="🌙" title="Killed at night" onPress={() => doEliminate(pick, 'night')} />
            <Button icon="👮" title="Arrested" onPress={() => doEliminate(pick, 'arrest')} />
            <Button variant="ghost" title="Cancel" onPress={() => setPick(null)} />
          </View>
        ) : pick ? (
          <View style={{ gap: 10 }}>
            <Button icon="↩️" title="Undo (revive)" onPress={() => { actions.revive(pick.id); toast(`${pick.name} is back`); setPick(null); }} />
            <Button variant="ghost" title="Cancel" onPress={() => setPick(null)} />
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={confirmVote && !!leader} onClose={() => setConfirmVote(false)} title={leader ? `Eliminate ${leader.name}?` : ''} desc="The town has spoken.">
        <View style={{ gap: 10 }}>
          <Button variant="primary" title="Eliminate" onPress={() => leader && doEliminate(leader, 'vote')} />
          <Button variant="ghost" title="Cancel" onPress={() => setConfirmVote(false)} />
        </View>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function GameScreen() {
  useKeepAwake();
  const { game, customRoles, settings, actions } = useApp();

  const [stepIdx, setStepIdx] = useState(0);
  const [narrating, setNarrating] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const runRef = useRef(0);
  const speechTimer = useRef(null);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [morningOpen, setMorningOpen] = useState(false);
  const [selected, setSelected] = useState({}); // playerId -> cause
  const [announce, setAnnounce] = useState(null); // { lines: string[] }
  const [winOpen, setWinOpen] = useState(false);
  const pendingWinner = useRef(null);
  const [winner, setWinner] = useState(null);

  const onBack = useCallback(() => { setLeaveOpen(true); return true; }, []);
  useBack(onBack);

  useEffect(() => {
    if (!game) actions.resetTo('home');
  }, [game, actions]);

  const stopRun = useCallback(() => {
    runRef.current += 1;
    clearTimeout(speechTimer.current);
    try { Speech.stop(); } catch (e) { /* ignore */ }
    setNarrating(false);
    setCountdown(null);
  }, []);

  useEffect(() => () => {
    runRef.current += 1;
    clearTimeout(speechTimer.current);
    try { Speech.stop(); } catch (e) { /* ignore */ }
  }, []);

  const phase = game ? game.phase : 'night';
  const day = game ? game.day : 1;
  // Reset the night script whenever a new night begins.
  useEffect(() => {
    stopRun();
    setStepIdx(0);
  }, [phase, day, stopRun]);

  const steps = useMemo(() => (game ? nightSteps(game, customRoles) : []), [game, customRoles]);
  // Keep a stable copy for the narration loop (the script shouldn't shift mid-run).
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  if (!game) return null;

  const roleLabel = (p) => (settings.revealOnDeath ? ` (${roleById(p.roleId, customRoles).name})` : '');

  const showResult = (res) => {
    if (res && res.winner) pendingWinner.current = res.winner;
    const lines = [];
    if (res && res.player) lines.push(`💀 ${res.player.name} was eliminated${roleLabel(res.player)}.`);
    ((res && res.events) || []).forEach((e) => lines.push(`⚠️ ${e}`));
    setAnnounce({ title: 'Eliminated', lines });
  };

  const closeAnnounce = () => {
    setAnnounce(null);
    if (pendingWinner.current) {
      setWinner(pendingWinner.current);
      pendingWinner.current = null;
      setWinOpen(true);
    }
  };

  // ---------- night narration ----------
  const sleep = (ms, tok, onTick) => new Promise((resolve) => {
    const end = Date.now() + ms;
    const iv = setInterval(() => {
      if (runRef.current !== tok) { clearInterval(iv); resolve(); return; }
      const left = end - Date.now();
      if (onTick) onTick(left);
      if (left <= 0) { clearInterval(iv); resolve(); }
    }, 200);
  });

  const speakStep = (text, tok) => new Promise((resolve) => {
    if (!settings.narrator) {
      sleep(4000, tok).then(resolve);
      return;
    }
    clearTimeout(speechTimer.current);
    speechTimer.current = say(text, () => { clearTimeout(speechTimer.current); resolve(); });
  });

  const openMorning = () => {
    stopRun();
    setSelected({});
    setMorningOpen(true);
  };

  const narrate = async (from) => {
    stopRun();
    const tok = runRef.current;
    const list = stepsRef.current;
    setNarrating(true);
    for (let i = from; i < list.length; i += 1) {
      if (runRef.current !== tok) return;
      const st = list[i];
      setStepIdx(i);
      await speakStep(st.open, tok);
      if (runRef.current !== tok) return;
      if (st.wait) {
        await sleep(settings.nightAction * 1000, tok, (left) => setCountdown(Math.max(0, Math.ceil(left / 1000))));
        setCountdown(null);
        if (runRef.current !== tok) return;
      }
      if (st.close) {
        await speakStep(st.close, tok);
        if (runRef.current !== tok) return;
      }
    }
    setNarrating(false);
    setCountdown(null);
    openMorning();
  };

  const next = () => {
    stopRun();
    if (stepIdx >= steps.length - 1) openMorning();
    else setStepIdx(stepIdx + 1);
  };
  const prev = () => { stopRun(); setStepIdx(Math.max(0, stepIdx - 1)); };

  // ---------- morning ----------
  const toggleSel = (id) => {
    const n = { ...selected };
    if (n[id]) delete n[id]; else n[id] = 'night';
    setSelected(n);
  };

  const confirmMorning = () => {
    const lines = [];
    let win = null;
    Object.keys(selected).forEach((id) => {
      const res = actions.eliminate(id, selected[id]);
      if (res.player) lines.push(`💀 ${res.player.name} — ${CAUSE_LABEL[selected[id]]}${roleLabel(res.player)}`);
      (res.events || []).forEach((e) => lines.push(`⚠️ ${e}`));
      if (res.winner) win = res.winner;
    });
    actions.setPhase('day');
    haptic(settings, 'success');
    setMorningOpen(false);
    if (!lines.length) lines.push('🌅 Nobody died last night.');
    pendingWinner.current = win;
    setAnnounce({ title: 'Good morning, town', lines });
  };

  const alive = game.players.filter((p) => p.alive);
  const isNight = game.phase === 'night';
  const cur = steps[Math.min(stepIdx, steps.length - 1)];

  const nightFooter = (
    <>
      <Row>
        <Button style={{ flex: 1 }} variant="ghost" title="‹ Back" disabled={stepIdx === 0} onPress={prev} />
        {narrating
          ? <Button style={{ flex: 2 }} variant="danger" icon="⏹" title="Pause" onPress={stopRun} />
          : <Button style={{ flex: 2 }} variant="gold" icon="▶" title={stepIdx > 0 ? 'Resume narration' : 'Narrate night'} onPress={() => narrate(stepIdx)} />}
        <Button style={{ flex: 1 }} variant="ghost" title="Next ›" onPress={next} />
      </Row>
      <Button variant="default" icon="☀️" title="It's morning" onPress={openMorning} />
    </>
  );
  const dayFooter = (
    <Button variant="primary" icon="🌙" title={`Start Night ${game.day + 1}`} onPress={() => { stopRun(); actions.setPhase('night'); }} />
  );

  return (
    <Screen
      title={`${isNight ? '🌙 Night' : '☀️ Day'} ${game.day}`}
      right={<IconButton icon="👥" onPress={() => setPlayersOpen(true)} />}
      footer={isNight ? nightFooter : dayFooter}
    >
      {isNight ? (
        <>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            {alive.length} alive · Read each line aloud or let the narrator do it.
          </Text>
          {countdown !== null && (
            <Card color={colors.gold} style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.gold, fontSize: 44, fontWeight: '900' }}>{formatTime(countdown)}</Text>
              <Text style={{ color: colors.muted }}>{cur ? cur.who : ''} acting…</Text>
            </Card>
          )}
          {steps.map((st, i) => {
            const isCur = i === stepIdx;
            return (
              <Card key={st.key} onPress={() => { stopRun(); setStepIdx(i); }} color={isCur ? colors.gold : undefined} style={{ flexDirection: 'row', gap: 12, padding: 12, opacity: i < stepIdx ? 0.45 : 1 }}>
                <Text style={{ fontSize: 28 }}>{st.icon}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: isCur ? colors.gold : colors.text, fontWeight: '800', fontSize: 15 }}>{st.who}</Text>
                  <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21 }}>{st.open}</Text>
                  {st.allDead ? <Text style={{ color: colors.dim, fontSize: 12, fontStyle: 'italic' }}>(no one alive — read it anyway to keep secrets)</Text> : null}
                </View>
              </Card>
            );
          })}
        </>
      ) : (
        <DayView key={`day${game.day}`} game={game} settings={settings} customRoles={customRoles} actions={actions} onResult={showResult} />
      )}

      {/* Players list */}
      <Sheet visible={playersOpen} onClose={() => setPlayersOpen(false)} title={`Players (${alive.length}/${game.players.length} alive)`}>
        <View style={{ gap: 8 }}>
          {game.players.map((p) => (
            <Row key={p.id} style={{ opacity: p.alive ? 1 : 0.6 }}>
              <Text style={{ fontSize: 18 }}>{p.alive ? '🟢' : '💀'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
                {!p.alive && <Text style={{ color: colors.muted, fontSize: 12 }}>{CAUSE_LABEL[p.cause] || 'Eliminated'}</Text>}
              </View>
              {!p.alive && settings.revealOnDeath ? (() => { const r = roleById(p.roleId, customRoles); return <RoleIcon role={r} size={34} />; })() : null}
            </Row>
          ))}
        </View>
      </Sheet>

      {/* Leave game */}
      <Sheet visible={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave game?" desc="Pausing keeps the game so you can resume it from Home.">
        <View style={{ gap: 10 }}>
          <Button variant="primary" icon="⏸" title="Pause & go home" onPress={() => { stopRun(); setLeaveOpen(false); actions.resetTo('home'); }} />
          <Button variant="danger" icon="🏁" title="End game & reveal roles" onPress={() => { stopRun(); setLeaveOpen(false); actions.endGame(null); actions.replace('end'); }} />
          <Button variant="ghost" title="Cancel" onPress={() => setLeaveOpen(false)} />
        </View>
      </Sheet>

      {/* Morning: who died */}
      <Sheet visible={morningOpen} onClose={() => setMorningOpen(false)} title="Who didn't survive the night?" desc="Select anyone who died and pick how.">
        <View style={{ gap: 8 }}>
          {alive.map((p) => {
            const on = !!selected[p.id];
            return (
              <Card key={p.id} color={on ? colors.accent : undefined} style={{ padding: 10, gap: 8 }}>
                <Pressable onPress={() => toggleSel(p.id)} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20 }}>{on ? '☑️' : '⬜'}</Text>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
                </Pressable>
                {on && (
                  <Row style={{ flexWrap: 'wrap' }}>
                    {NIGHT_CAUSES.map((c) => (
                      <Pressable key={c.id} onPress={() => setSelected({ ...selected, [p.id]: c.id })} style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: selected[p.id] === c.id ? colors.accent : colors.line, backgroundColor: selected[p.id] === c.id ? colors.accent + '33' : colors.card2, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{c.label}</Text>
                      </Pressable>
                    ))}
                  </Row>
                )}
              </Card>
            );
          })}
          <Button variant="gold" icon="🌅" title={Object.keys(selected).length ? `Confirm ${Object.keys(selected).length} death${Object.keys(selected).length > 1 ? 's' : ''}` : 'Nobody died'} onPress={confirmMorning} />
          <Button variant="ghost" title="Cancel" onPress={() => setMorningOpen(false)} />
        </View>
      </Sheet>

      {/* Announcement */}
      <Sheet visible={!!announce} onClose={closeAnnounce} title={announce ? announce.title : ''}>
        <View style={{ gap: 10 }}>
          {announce && announce.lines.map((l, i) => (
            <Text key={i} style={{ color: colors.text, fontSize: 17, lineHeight: 24 }}>{l}</Text>
          ))}
          <Button variant="primary" title="Continue" onPress={closeAnnounce} />
        </View>
      </Sheet>

      {/* Win */}
      <Sheet visible={winOpen && !!winner} onClose={() => setWinOpen(false)}>
        {winner ? (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 48, textAlign: 'center' }}>🏆</Text>
            <Text style={{ color: (TEAMS[winner.team] || TEAMS.town).color, fontSize: 28, fontWeight: '900', textAlign: 'center' }}>{winner.title}</Text>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>{winner.detail}</Text>
            {game.players.filter((p) => (winner.playerIds || []).includes(p.id)).map((p) => {
              const r = roleById(p.roleId, customRoles);
              return (
                <Row key={p.id}>
                  <RoleIcon role={r} size={36} />
                  <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
                  <TeamTag team={r.team} />
                </Row>
              );
            })}
            <Button variant="gold" title="End game & reveal roles" onPress={() => { setWinOpen(false); stopRun(); actions.endGame(winner); actions.replace('end'); }} />
            <Button variant="ghost" title="Keep playing" onPress={() => setWinOpen(false)} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
