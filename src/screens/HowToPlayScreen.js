import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function HowToPlayScreen() {
  const { actions } = useApp();
  return <Screen title="HowToPlay" onBack={actions.goBack}><Text style={{ color: '#fff' }}>HowToPlay</Text></Screen>;
}
