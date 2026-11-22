// Pure game logic — no React, no storage. Everything here is easy to test in Node.
import { roleById, nightOf, allRoles, BUILTIN_ROLES } from './roles';

export const BUILTIN_IDS = BUILTIN_ROLES.map((r) => r.id);

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function randInt(n) {
  return Math.floor(Math.random() * n);
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function totalRoles(roleCounts) {
  return Object.values(roleCounts).reduce((s, n) => s + (n || 0), 0);
}

export const KILLER_TEAMS = ['mafia', 'werewolf'];

/**
 * Validate a role setup. Returns null when it is playable, otherwise a message.
 */
export function validateSetup(count, roleCounts, customRoles = []) {
  const total = totalRoles(roleCounts);
  if (total < count) return `Add ${count - total} more role${count - total === 1 ? '' : 's'}.`;
  if (total > count) return `Remove ${total - count} role${total - count === 1 ? '' : 's'}.`;
  const hasKiller = Object.entries(roleCounts).some(
    ([id, n]) => n > 0 && KILLER_TEAMS.includes(roleById(id, customRoles).team),
  );
  if (!hasKiller) return 'Add at least one Mafia or Werewolf role.';
  const killers = Object.entries(roleCounts)
    .filter(([id]) => KILLER_TEAMS.includes(roleById(id, customRoles).team))
    .reduce((s, [, n]) => s + n, 0);
  if (killers >= count - killers) return 'Too many killers — they would win immediately.';
  return null;
}

/** A sensible starting setup for n players. */
export function suggestRoles(n) {
  const counts = {};
  const mafia = Math.max(1, Math.round(n / 4.5));
  counts.mafia = mafia;
  if (n >= 5) counts.doctor = 1;
  if (n >= 6) counts.detective = 1;
  if (n >= 8) counts.jester = 1;
  if (n >= 10) { counts.godfather = 1; counts.mafia = Math.max(1, mafia - 1); }
  if (n >= 12) counts.officer = 1;
  const used = totalRoles(counts);
  counts.villager = Math.max(0, n - used);
  return counts;
}

/**
 * Create a new game. names: string[]; roleCounts: { roleId: n }.
 * Returns the game object stored in app state.
 */
export function createGame(names, roleCounts, customRoles = []) {
  const deck = [];
  Object.entries(roleCounts).forEach(([id, n]) => {
    for (let i = 0; i < n; i++) deck.push(id);
  });
  const dealt = shuffle(deck);
  const players = names.map((name, i) => ({
    id: `p${i}`,
    name,
    roleId: dealt[i],
    alive: true,
    cause: null, // 'vote' | 'night' | 'arrest' | 'heartbreak' | 'obsession'
    targetId: null, // Executioner target
  }));

  // Executioners get a random target, preferring town players.
  players.forEach((p) => {
    if (p.roleId !== 'executioner') return;
    const others = players.filter((o) => o.id !== p.id);
    const town = others.filter((o) => roleById(o.roleId, customRoles).team === 'town');
    const pool = town.length ? town : others;
    p.targetId = pool[randInt(pool.length)].id;
  });

  return {
    players,
    revealed: players.map(() => false),
    phase: 'night', // 'night' | 'day'
    day: 1,
    over: false,
    winner: null, // { team, title, detail }
    log: [],
    roleCounts,
  };
}

/** What a player privately learns when they see their card. Returns string[]. */
export function intelFor(game, playerId, customRoles = [], settings = {}) {
  const me = game.players.find((p) => p.id === playerId);
  if (!me) return [];
  const role = roleById(me.roleId, customRoles);
  const lines = [];
  if (role.id === 'executioner' && me.targetId) {
    const t = game.players.find((p) => p.id === me.targetId);
    if (t) lines.push(`🎯 Your target: ${t.name}`);
  }
  if (settings.showTeammates !== false && KILLER_TEAMS.includes(role.team)) {
    const mates = game.players.filter(
      (p) => p.id !== me.id && roleById(p.roleId, customRoles).team === role.team,
    );
    const label = role.team === 'mafia' ? 'Your fellow Mafia' : 'Your fellow Werewolves';
    if (mates.length) {
      lines.push(`${label}: ${mates.map((p) => `${p.name} (${roleById(p.roleId, customRoles).name})`).join(', ')}`);
    } else {
      lines.push(role.team === 'mafia' ? 'You are the only Mafia member.' : 'You are the lone Werewolf.');
    }
  }
  return lines;
}

/**
 * Night script for the current night. Includes every role that was dealt (even dead ones),
 * so the narrator never leaks who is still alive.
 * Returns [{ key, icon, who, open, close, wait, allDead }]
 */
export function nightSteps(game, customRoles = []) {
  const dealt = new Set(game.players.map((p) => p.roleId));
  const aliveRoles = new Set(game.players.filter((p) => p.alive).map((p) => p.roleId));
  const steps = [{ key: 'start', icon: '🌙', who: 'Everyone', open: `Night ${game.day}. Everyone, close your eyes.`, close: null, wait: false }];

  const roles = allRoles(customRoles)
    .map((r) => ({ role: r, night: nightOf(r) }))
    .filter(({ role, night }) => {
      if (!night) return false;
      if (night.firstNightOnly && game.day > 1) return false;
      if (role.id === 'mafia') return dealt.has('mafia') || dealt.has('godfather');
      return dealt.has(role.id);
    })
    .sort((a, b) => a.night.order - b.night.order);

  roles.forEach(({ role, night }) => {
    let open = night.open;
    let allDead = !aliveRoles.has(role.id);
    if (role.id === 'mafia') {
      allDead = !game.players.some((p) => p.alive && roleById(p.roleId, customRoles).team === 'mafia');
      if (dealt.has('godfather')) open += ' The Godfather has the final say.';
      if (dealt.has('littlechild')) open += ' Little Child, you may peek — carefully.';
    }
    steps.push({ key: role.id, icon: role.icon, who: role.name, open, close: night.close, wait: true, allDead });
  });

  steps.push({ key: 'end', icon: '☀️', who: 'Everyone', open: 'Everyone, open your eyes. The sun rises.', close: null, wait: false });
  return steps;
}

/**
 * Remove a player. Returns { game, events } where events are strings worth announcing
 * (e.g. Executioner dying of obsession). Does not decide the winner — call checkWinner.
 */
export function eliminate(game, playerId, cause, customRoles = []) {
  const g = { ...game, players: game.players.map((p) => ({ ...p })), log: [...game.log] };
  const events = [];
  const p = g.players.find((x) => x.id === playerId);
  if (!p || !p.alive) return { game: g, events };
  p.alive = false;
  p.cause = cause;
  g.log.push({ day: g.day, phase: g.phase, playerId, cause });

  // Executioner whose target dies at night dies too.
  if (cause !== 'vote') {
    g.players
      .filter((e) => e.alive && e.roleId === 'executioner' && e.targetId === p.id)
      .forEach((e) => {
        e.alive = false;
        e.cause = 'obsession';
        g.log.push({ day: g.day, phase: g.phase, playerId: e.id, cause: 'obsession' });
        events.push(`${e.name} was consumed by obsession and dies too.`);
      });
  }
  return { game: g, events, player: p };
}

export function revive(game, playerId) {
  return {
    ...game,
    players: game.players.map((p) => (p.id === playerId ? { ...p, alive: true, cause: null } : p)),
  };
}

/**
 * Who has won, if anyone. lastElimination: { playerId, cause } (optional) for
 * solo wins (Jester, Executioner). Returns null or { team, title, detail, playerIds }.
 */
export function checkWinner(game, customRoles = [], lastElimination = null) {
  const byId = (id) => game.players.find((p) => p.id === id);
  if (lastElimination && lastElimination.cause === 'vote') {
    const victim = byId(lastElimination.playerId);
    if (victim && victim.roleId === 'jester') {
      return { team: 'neutral', title: 'The Jester wins!', detail: `${victim.name} fooled the town into voting them out.`, playerIds: [victim.id] };
    }
    const exe = game.players.find((p) => p.alive && p.roleId === 'executioner' && p.targetId === lastElimination.playerId);
    if (exe) {
      return { team: 'neutral', title: 'The Executioner wins!', detail: `${exe.name} got their target, ${victim.name}, voted out.`, playerIds: [exe.id] };
    }
  }

  const alive = game.players.filter((p) => p.alive);
  const teamOf = (p) => roleById(p.roleId, customRoles).team;
  const mafia = alive.filter((p) => teamOf(p) === 'mafia');
  const wolves = alive.filter((p) => teamOf(p) === 'werewolf');
  const ids = (team) => game.players.filter((p) => teamOf(p) === team).map((p) => p.id);

  if (alive.length === 0) return { team: 'neutral', title: 'Nobody survived', detail: 'The night claimed everyone.', playerIds: [] };
  if (mafia.length === 0 && wolves.length === 0) {
    return { team: 'town', title: 'The Town wins!', detail: 'Every killer has been removed.', playerIds: ids('town') };
  }
  if (wolves.length === 0 && mafia.length >= alive.length - mafia.length) {
    return { team: 'mafia', title: 'The Mafia wins!', detail: 'The Mafia now matches the rest of the town.', playerIds: ids('mafia') };
  }
  if (mafia.length === 0 && wolves.length >= alive.length - wolves.length) {
    return { team: 'werewolf', title: 'The Werewolves win!', detail: 'The pack now matches everyone else.', playerIds: ids('werewolf') };
  }
  return null;
}

export const CAUSE_LABEL = {
  vote: 'Voted out',
  night: 'Killed at night',
  arrest: 'Arrested',
  heartbreak: 'Died of heartbreak',
  obsession: 'Consumed by obsession',
};
