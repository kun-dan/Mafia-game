import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store';
import { useBack } from './src/ui';
import { colors } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import PlayerCountScreen from './src/screens/PlayerCountScreen';
import NamesScreen from './src/screens/NamesScreen';
import RolesScreen from './src/screens/RolesScreen';
import SavedGroupsScreen from './src/screens/SavedGroupsScreen';
import CustomRolesScreen from './src/screens/CustomRolesScreen';
import EditRoleScreen from './src/screens/EditRoleScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HowToPlayScreen from './src/screens/HowToPlayScreen';
import RevealScreen from './src/screens/RevealScreen';
import GameScreen from './src/screens/GameScreen';
import EndScreen from './src/screens/EndScreen';

const SCREENS = {
  home: HomeScreen,
  count: PlayerCountScreen,
  names: NamesScreen,
  roles: RolesScreen,
  groups: SavedGroupsScreen,
  customRoles: CustomRolesScreen,
  editRole: EditRoleScreen,
  settings: SettingsScreen,
  howto: HowToPlayScreen,
  reveal: RevealScreen,
  game: GameScreen,
  end: EndScreen,
};

// Root-level back: pop the stack. Rendered before <Router/> so its listener is registered
// first; screens register their own useBack later, so theirs run first (LIFO).
function RootBack() {
  const { actions } = useApp();
  const onBack = useCallback(() => actions.goBack(), [actions]);
  useBack(onBack);
  return null;
}

function Router() {
  const { loaded, route } = useApp();

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  const Screen = SCREENS[route.name] || HomeScreen;
  return <Screen key={route.name} params={route.params} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="light" />
          <RootBack />
          <Router />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
