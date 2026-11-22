import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function RolesScreen() {
  const { actions } = useApp();
  return <Screen title="Roles" onBack={actions.goBack}><Text style={{ color: '#fff' }}>Roles</Text></Screen>;
}
