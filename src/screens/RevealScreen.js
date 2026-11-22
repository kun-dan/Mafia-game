import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function RevealScreen() {
  const { actions } = useApp();
  return <Screen title="Reveal" onBack={actions.goBack}><Text style={{ color: '#fff' }}>Reveal</Text></Screen>;
}
