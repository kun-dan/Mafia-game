import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function PlayerCountScreen() {
  const { actions } = useApp();
  return <Screen title="PlayerCount" onBack={actions.goBack}><Text style={{ color: '#fff' }}>PlayerCount</Text></Screen>;
}
