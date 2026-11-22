# Midnight Mafia

A pass-the-phone Mafia / Werewolf party game for Android, built with Expo (React Native, plain JavaScript). No moderator needed and no internet required.

## Features

- **Role allocation** for 4–25 players: pick the player count, enter names, choose roles, then pass the phone so each player privately sees their role (press-and-hold to reveal). Mafia and Werewolves can see their teammates; the Executioner sees their target.
- **All roles unlocked:** Mafia, Godfather, Framer, Werewolf, Doctor, Officer, Detective, Tracker, Cupid, Little Child, Mayor, Villager, Jester, Executioner.
- **Custom roles:** create your own roles with a name, emoji, team (Town / Mafia / Werewolves / Neutral), description, and an optional night action that the narrator calls out.
- **Saved groups:** bookmark a list of player names (optionally with the role setup) and load it next time.
- **Night narrator:** the phone reads the night script aloud, giving each role time to act, or you can step through it yourself.
- **Day timers:** discussion, defense and voting countdowns with quick presets, a vote tally, eliminations, and automatic win detection (Town, Mafia, Werewolves, Jester, Executioner).
- Everything (groups, custom roles, settings, a game in progress) is saved on the device.

## Develop

```bash
npm install
npx expo start          # run in Expo Go / a dev build
node scripts/check.js   # quick syntax check
```

## Build the Android APK in the cloud (EAS)

```bash
export EXPO_TOKEN=...   # an Expo access token (never commit it)
npx eas-cli@latest build --platform android --profile preview      # installable .apk
npx eas-cli@latest build --platform android --profile production   # .aab for Google Play
```
