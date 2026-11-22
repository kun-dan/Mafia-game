// App-wide state: navigation, setup, current game, saved groups, custom roles, settings.
// Everything except `stack` is persisted to AsyncStorage.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as logic from './logic';

const STORAGE_KEY = 'midnight-mafia/v1';

export const DEFAULT_SETTINGS = {
  discussion: 180, // seconds
  defense: 30,
  voting: 60,
  nightAction: 12, // seconds each role gets during auto-narration
  narrator: true, // speak the night script aloud
  revealOnDeath: true, // show a player's role when they are eliminated
  showTeammates: true, // Mafia / Werewolves see each other on their role card
  haptics: true,
};

const initialData = {
  setup: { count: null, names: [], roleCounts: {} },
  game: null,
  savedGroups: [],
  customRoles: [],
  settings: DEFAULT_SETTINGS,
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [loaded, setLoaded] = useState(false);
  // Navigation stack: [{ name, params }]
  const [stack, setStack] = useState([{ name: 'home', params: {} }]);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        setData({
          ...initialData,
          ...saved,
          settings: { ...DEFAULT_SETTINGS, ...(saved.settings || {}) },
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, loaded]);

  const update = useCallback((fn) => setData((d) => ({ ...d, ...fn(d) })), []);

  // ---------- navigation ----------
  const navigate = useCallback((name, params = {}) => setStack((s) => [...s, { name, params }]), []);
  const replace = useCallback((name, params = {}) => setStack((s) => [...s.slice(0, -1), { name, params }]), []);
  const resetTo = useCallback((name, params = {}) => setStack([{ name: 'home', params: {} }, ...(name === 'home' ? [] : [{ name, params }])]), []);
  /** Returns false when already at the root (so the OS may close the app). */
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const goBack = useCallback(() => {
    if (stackRef.current.length <= 1) return false;
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    return true;
  }, []);

  const actions = useMemo(() => ({
    navigate, replace, resetTo, goBack,

    // ---------- setup ----------
    setCount: (count) => update((d) => {
      const names = [...d.setup.names];
      names.length = count;
      return {
        setup: {
          ...d.setup,
          count,
          names: Array.from(names, (n) => n || ''),
          // Keep the old roles only if they still fit; otherwise start from a suggestion.
          roleCounts: logic.totalRoles(d.setup.roleCounts) === count ? d.setup.roleCounts : logic.suggestRoles(count),
        },
      };
    }),
    setName: (index, name) => update((d) => {
      const names = [...d.setup.names];
      names[index] = name;
      return { setup: { ...d.setup, names } };
    }),
    setNames: (names) => update((d) => ({ setup: { ...d.setup, names } })),
    setRoleCount: (roleId, n) => update((d) => {
      const roleCounts = { ...d.setup.roleCounts, [roleId]: Math.max(0, n) };
      if (!roleCounts[roleId]) delete roleCounts[roleId];
      return { setup: { ...d.setup, roleCounts } };
    }),
    setRoleCounts: (roleCounts) => update((d) => ({ setup: { ...d.setup, roleCounts } })),

    // ---------- saved groups (bookmarks) ----------
    /** Save names (and optionally roles). Overwrites a group with the same name. Returns 'created' | 'updated'. */
    saveGroup: (name, { includeRoles = false } = {}) => {
      const d = dataRef.current;
      const clean = name.trim() || `Group of ${d.setup.names.length}`;
      const existing = d.savedGroups.find((g) => g.name.toLowerCase() === clean.toLowerCase());
      const group = {
        id: existing ? existing.id : logic.uid('grp'),
        name: clean,
        names: d.setup.names.map((n, i) => n.trim() || `Player ${i + 1}`),
        roleCounts: includeRoles ? d.setup.roleCounts : (existing ? existing.roleCounts : null),
        savedAt: Date.now(),
      };
      update((dd) => ({
        savedGroups: existing
          ? dd.savedGroups.map((g) => (g.id === group.id ? group : g))
          : [group, ...dd.savedGroups],
      }));
      return existing ? 'updated' : 'created';
    },
    deleteGroup: (id) => update((d) => ({ savedGroups: d.savedGroups.filter((g) => g.id !== id) })),
    renameGroup: (id, name) => update((d) => ({
      savedGroups: d.savedGroups.map((g) => (g.id === id ? { ...g, name: name.trim() || g.name } : g)),
    })),
    /** Load a group's names (and roles, if saved) into setup. */
    loadGroup: (id) => update((d) => {
      const g = d.savedGroups.find((x) => x.id === id);
      if (!g) return {};
      const known = new Set([...logic.BUILTIN_IDS, ...d.customRoles.map((r) => r.id)]);
      let roleCounts = g.roleCounts
        ? Object.fromEntries(Object.entries(g.roleCounts).filter(([rid]) => known.has(rid)))
        : null;
      if (!roleCounts || logic.totalRoles(roleCounts) !== g.names.length) roleCounts = logic.suggestRoles(g.names.length);
      return { setup: { count: g.names.length, names: [...g.names], roleCounts } };
    }),

    // ---------- custom roles ----------
    /** role: { id?, name, icon, team, desc, wakes, nightText }. Returns the saved role. */
    saveCustomRole: (role) => {
      const saved = { ...role, id: role.id || logic.uid('custom'), custom: true };
      update((d) => ({
        customRoles: d.customRoles.some((r) => r.id === saved.id)
          ? d.customRoles.map((r) => (r.id === saved.id ? saved : r))
          : [...d.customRoles, saved],
      }));
      return saved;
    },
    deleteCustomRole: (id) => update((d) => {
      const roleCounts = { ...d.setup.roleCounts };
      delete roleCounts[id];
      return { customRoles: d.customRoles.filter((r) => r.id !== id), setup: { ...d.setup, roleCounts } };
    }),

    // ---------- settings ----------
    updateSettings: (patch) => update((d) => ({ settings: { ...d.settings, ...patch } })),

    // ---------- game ----------
    /** Deal roles using the current setup. Blank names become "Player N". */
    startGame: () => update((d) => {
      const names = d.setup.names.map((n, i) => n.trim() || `Player ${i + 1}`);
      return { setup: { ...d.setup, names }, game: logic.createGame(names, d.setup.roleCounts, d.customRoles) };
    }),
    /** Re-deal the same players and roles (before or after a game). */
    reshuffle: () => update((d) => ({
      game: logic.createGame(d.setup.names.map((n, i) => n.trim() || `Player ${i + 1}`), d.setup.roleCounts, d.customRoles),
    })),
    markRevealed: (index) => update((d) => {
      const revealed = [...d.game.revealed];
      revealed[index] = true;
      return { game: { ...d.game, revealed } };
    }),
    /** Move to day (after a night) or to the next night (after a day). */
    setPhase: (phase) => update((d) => ({
      game: { ...d.game, phase, day: phase === 'night' && d.game.phase === 'day' ? d.game.day + 1 : d.game.day },
    })),
    /**
     * Eliminate a player. Returns { events: string[], winner, player } synchronously,
     * computed from the latest state.
     */
    eliminate: (playerId, cause) => {
      const d = dataRef.current;
      const res = logic.eliminate(d.game, playerId, cause, d.customRoles);
      const winner = logic.checkWinner(res.game, d.customRoles, { playerId, cause });
      dataRef.current = { ...d, game: res.game };
      update(() => ({ game: res.game }));
      return { events: res.events, winner, player: res.player };
    },
    revive: (playerId) => update((d) => ({ game: logic.revive(d.game, playerId) })),
    /** winner: result of checkWinner, or null for "ended without a winner". */
    endGame: (winner) => update((d) => ({ game: { ...d.game, over: true, winner: winner || null } })),
    clearGame: () => update(() => ({ game: null })),
  }), [navigate, replace, resetTo, goBack, update]);

  const route = stack[stack.length - 1];
  const value = useMemo(
    () => ({ ...data, loaded, route, stackDepth: stack.length, actions }),
    [data, loaded, route, stack.length, actions],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * const { setup, game, savedGroups, customRoles, settings, route, actions } = useApp();
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
