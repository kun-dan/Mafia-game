import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function SettingsScreen() {
  const { actions } = useApp();
  return <Screen title="Settings" onBack={actions.goBack}><Text style={{ color: '#fff' }}>Settings</Text></Screen>;
}
