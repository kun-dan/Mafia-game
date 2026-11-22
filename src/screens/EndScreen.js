import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function EndScreen() {
  const { actions } = useApp();
  return <Screen title="End" onBack={actions.goBack}><Text style={{ color: '#fff' }}>End</Text></Screen>;
}
