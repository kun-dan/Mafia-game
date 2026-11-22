import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function GameScreen() {
  const { actions } = useApp();
  return <Screen title="Game" onBack={actions.goBack}><Text style={{ color: '#fff' }}>Game</Text></Screen>;
}
