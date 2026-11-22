import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function HomeScreen() {
  const { actions } = useApp();
  return <Screen title="Home" onBack={actions.goBack}><Text style={{ color: '#fff' }}>Home</Text></Screen>;
}
