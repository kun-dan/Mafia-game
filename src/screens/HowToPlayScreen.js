import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Card, SectionLabel, RoleIcon, TeamTag, s } from '../ui';
import { colors, TEAMS, TEAM_ORDER } from '../theme';
import { allRoles } from '../roles';
import { useApp } from '../store';

const P = ({ children }) => <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{children}</Text>;
const B = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <Text style={{ color: colors.accent }}>•</Text>
    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, flex: 1 }}>{children}</Text>
  </View>
);

function Section({ icon, title, children }) {
  return (
    <>
      <SectionLabel>{`${icon}  ${title.toUpperCase()}`}</SectionLabel>
      <Card style={{ gap: 8 }}>{children}</Card>
    </>
  );
}

export default function HowToPlayScreen() {
  const { customRoles, actions } = useApp();
  return (
    <Screen title="How to Play" onBack={actions.goBack}>
      <Section icon="🎯" title="Goal">
        <P>Everyone secretly belongs to a team. Work out who to trust, and get your team to victory.</P>
        {TEAM_ORDER.map((k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: TEAMS[k].color, marginTop: 6 }} />
            <Text style={{ flex: 1, color: colors.muted, fontSize: 14, lineHeight: 21 }}>
              <Text style={{ color: TEAMS[k].color, fontWeight: '800' }}>{TEAMS[k].label}: </Text>{TEAMS[k].goal}
            </Text>
          </View>
        ))}
      </Section>
      <Section icon="🧩" title="Setup">
        <B>Choose how many people are playing.</B>
        <B>Enter everyone's name, then pick the roles in the deck.</B>
        <B>Save the group as a bookmark to reuse it next game.</B>
      </Section>
      <Section icon="🎴" title="Revealing roles">
        <B>Pass the phone around. Each player taps their own name in private.</B>
        <B>Memorize your role, hide the screen, then hand the phone on.</B>
        <B>Mafia and Werewolves can see their teammates on their card.</B>
      </Section>
      <Section icon="🌙" title="Night">
        <B>Everyone closes their eyes.</B>
        <B>The app narrates each role's turn aloud, or one person reads the script.</B>
        <B>Killers silently choose a victim; the Doctor protects, the Detective investigates, and so on.</B>
      </Section>
      <Section icon="☀️" title="Day">
        <B>Announce who died overnight.</B>
        <B>Discussion timer: everyone debates who is suspicious.</B>
        <B>Defense timer: accused players plead their case.</B>
        <B>Voting timer: tally the votes, then tap the chosen player to eliminate them.</B>
        <B>Then night falls again.</B>
      </Section>
      <Section icon="🏆" title="Winning">
        <B>Town wins when every killer is gone.</B>
        <B>Mafia or Werewolves win when they equal everyone else still alive.</B>
        <B>The Jester wins alone if voted out by the town; the Executioner wins alone if their target is voted out.</B>
      </Section>

      <SectionLabel>🎭  ROLES</SectionLabel>
      {allRoles(customRoles).map((r) => (
        <Card key={r.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <RoleIcon role={r} size={44} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={[s.text, { fontWeight: '800' }]}>{r.name}</Text>
              <TeamTag team={r.team} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{r.desc}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
