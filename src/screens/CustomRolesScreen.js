import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function CustomRolesScreen() {
  const { actions } = useApp();
  return <Screen title="CustomRoles" onBack={actions.goBack}><Text style={{ color: '#fff' }}>CustomRoles</Text></Screen>;
}
