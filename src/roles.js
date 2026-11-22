// Built-in role definitions. Custom roles share the same shape (plus custom: true).
// night: null if the role never wakes; otherwise { order, open, close, firstNightOnly? }
export const BUILTIN_ROLES = [
  {
    id: 'mafia', name: 'Mafia', icon: '🔪', team: 'mafia',
    desc: 'Each night, wake with the rest of the Mafia and silently agree on one player to eliminate.',
    night: { order: 30, open: 'Mafia, open your eyes. Silently agree on one player to eliminate.', close: 'Mafia, close your eyes.' },
  },
  {
    id: 'godfather', name: 'Godfather', icon: '🎩', team: 'mafia',
    desc: 'You lead the Mafia and make the final call on the night kill. The Detective sees you as innocent — unless the Framer framed you.',
    night: null, // wakes together with the Mafia step
  },
  {
    id: 'framer', name: 'Framer', icon: '🖌️', team: 'mafia',
    desc: 'You are Mafia. Once per game, frame a player at night: if the Detective checks them that night, they appear guilty.',
    night: { order: 20, open: 'Framer, open your eyes. If you want to use your one frame, point at a player now.', close: 'Framer, close your eyes.' },
  },
  {
    id: 'werewolf', name: 'Werewolf', icon: '🐺', team: 'werewolf',
    desc: 'A beast hiding among the town — and not on the Mafia\'s side. Each night the Werewolves choose a victim. Win when you outnumber everyone else.',
    night: { order: 35, open: 'Werewolves, open your eyes. Silently choose one victim.', close: 'Werewolves, close your eyes.' },
  },
  {
    id: 'doctor', name: 'Doctor', icon: '💉', team: 'town',
    desc: 'Each night, choose one player to protect. If they are attacked that night, they survive.',
    night: { order: 50, open: 'Doctor, open your eyes. Point at one player to protect tonight.', close: 'Doctor, close your eyes.' },
  },
  {
    id: 'officer', name: 'Officer', icon: '👮', team: 'town',
    desc: 'Each night, choose one player to arrest. They are removed from the game — so choose carefully.',
    night: { order: 40, open: 'Officer, open your eyes. Point at the player you want to arrest, or shake your head to skip.', close: 'Officer, close your eyes.' },
  },
  {
    id: 'detective', name: 'Detective', icon: '🔍', team: 'town',
    desc: 'Once per game, investigate a player at night and learn if they are guilty or innocent. The Godfather fools you; a Framer can mislead you.',
    night: { order: 60, open: 'Detective, open your eyes. If you want to use your one investigation, point at a player. Thumbs up means innocent, thumbs down means guilty.', close: 'Detective, close your eyes.' },
  },
  {
    id: 'tracker', name: 'Tracker', icon: '👣', team: 'town',
    desc: 'Once per game, watch a player at night and learn who visited them — but not why.',
    night: { order: 70, open: 'Tracker, open your eyes. If you want to use your one watch, point at a player.', close: 'Tracker, close your eyes.' },
  },
  {
    id: 'cupid', name: 'Cupid', icon: '💘', team: 'town',
    desc: 'On the first night, bind two players in love. If one of them dies, the other dies of heartbreak.',
    night: { order: 10, firstNightOnly: true, open: 'Cupid, open your eyes. Choose two players to fall in love and tap them on the shoulder.', close: 'Cupid, close your eyes. Lovers, open your eyes and find each other. Lovers, close your eyes.' },
  },
  {
    id: 'littlechild', name: 'Little Child', icon: '👁️', team: 'town',
    desc: 'You may secretly peek while the Mafia is awake. Stay hidden — if the Mafia spots you, you are in danger.',
    night: null, // peeks during the Mafia step
  },
  {
    id: 'mayor', name: 'Mayor', icon: '🎖️', team: 'town',
    desc: 'Once per game (from day 2), reveal yourself as Mayor: your vote counts twice from then on — but the Doctor can no longer save you.',
    night: null,
  },
  {
    id: 'villager', name: 'Villager', icon: '🧑‍🌾', team: 'town',
    desc: 'No night powers. Discuss, deduce and vote out the killers during the day.',
    night: null,
  },
  {
    id: 'jester', name: 'Jester', icon: '🃏', team: 'neutral',
    desc: 'You win alone if the town votes you out during the day. Dying at night gets you nothing. Act suspicious — but not too suspicious.',
    night: null,
  },
  {
    id: 'executioner', name: 'Executioner', icon: '🎯', team: 'neutral',
    desc: 'You get a secret target. You win alone if the town votes them out. If your target dies at night, your obsession consumes you and you die too.',
    night: null,
  },
];

export const ICON_CHOICES = [
  '🕵️', '🧙', '🧛', '🧟', '👻', '🦇', '🐍', '🦊', '🐻', '🦉', '🗡️', '🏹', '💣', '☠️', '🧪', '🔮',
  '📜', '⚖️', '🛡️', '👑', '💰', '🎭', '🕯️', '⛓️', '🌙', '☀️', '🔥', '❄️', '⚡', '🍀', '🐈‍⬛', '🧸',
];

export function allRoles(customRoles = []) {
  return [...BUILTIN_ROLES, ...customRoles];
}

export function roleById(id, customRoles = []) {
  return allRoles(customRoles).find((r) => r.id === id) || {
    id, name: 'Unknown role', icon: '❔', team: 'town', desc: 'This role no longer exists.', night: null,
  };
}

// Convert a custom role into the night-step shape used by built-ins.
export function nightOf(role) {
  if (!role.custom) return role.night;
  if (!role.wakes) return null;
  return {
    order: 80,
    open: `${role.name}, open your eyes. ${role.nightText || 'Use your ability now.'}`,
    close: `${role.name}, close your eyes.`,
  };
}
