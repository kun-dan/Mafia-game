import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const LABELS = ['Players', 'Names', 'Roles'];

/** 3-step progress indicator. step: 0 | 1 | 2 */
export default function SetupSteps({ step }) {
  return (
    <View style={st.row}>
      {LABELS.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <View style={[st.line, i <= step && { backgroundColor: colors.accent }]} />}
          <View style={st.item}>
            <View style={[st.dot, i <= step && st.dotOn, i === step && st.dotCur]}>
              <Text style={[st.dotText, i <= step && { color: '#fff' }]}>{i < step ? '✓' : i + 1}</Text>
            </View>
            <Text style={[st.label, i === step && { color: colors.text }]}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 24, marginBottom: 12 },
  item: { alignItems: 'center', width: 64, gap: 4 },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotCur: { borderColor: colors.gold, borderWidth: 2 },
  dotText: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  label: { color: colors.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  line: { flex: 1, height: 2, backgroundColor: colors.line, marginTop: 14, borderRadius: 1 },
});
