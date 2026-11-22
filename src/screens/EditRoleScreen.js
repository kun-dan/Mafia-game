import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../ui';
import { useApp } from '../store';

// TODO placeholder
export default function EditRoleScreen() {
  const { actions } = useApp();
  return <Screen title="EditRole" onBack={actions.goBack}><Text style={{ color: '#fff' }}>EditRole</Text></Screen>;
}
