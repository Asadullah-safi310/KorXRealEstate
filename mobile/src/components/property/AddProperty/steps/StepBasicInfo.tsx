import React, { useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../../../../hooks/useThemeColor';
import { AppText } from '../../../AppText';
import personStore from '../../../../stores/PersonStore';
import authStore from '../../../../stores/AuthStore';
import Avatar from '../../../../components/Avatar';
import { AnimatedFormInput } from '../../../AnimatedFormInput';

const StepBasicInfo = observer(() => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();

  useEffect(() => {
    if (personStore.agents.length === 0) personStore.fetchAgents();
    if (authStore.isAdmin && personStore.persons.length === 0) personStore.fetchPersons();

    // Auto-select current user if they are an agent and no agent is selected yet (initial state is null)
    if (values.agent_id === null) {
      if (authStore.user?.role === 'agent') {
        const currentPersonId = authStore.user?.person_id || authStore.user?.user_id || authStore.user?.id;
        if (currentPersonId) {
          setFieldValue('agent_id', String(currentPersonId));
        }
      } else {
        setFieldValue('agent_id', ''); // Default to None for non-agents
      }
    }
  }, [setFieldValue, values.agent_id]);

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return (
        <AppText variant="caption" weight="semiBold" style={[{ color: theme.danger }, styles.errorText]}>
          {errors[field] as string}
        </AppText>
      );
    }
    return null;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Basic Info</AppText>
      <AppText variant="small" style={[{ color: theme.subtext }, styles.sectionSubtitle]}>
        Give your property a catchy title and a clear description.
      </AppText>

      <AnimatedFormInput
        label="Listing Title"
        placeholder="e.g. Modern 3-Bedroom Villa with Pool"
        value={values.title}
        onChangeText={(t) => setFieldValue('title', t)}
        error={errors.title as string}
        touched={touched.title}
        icon={<MaterialCommunityIcons name="format-title" size={20} color={theme.subtext} />}
      />

      <AnimatedFormInput
        label="Property Description"
        placeholder="Describe the key features, amenities, and nearby attractions..."
        value={values.description}
        onChangeText={(t) => setFieldValue('description', t)}
        error={errors.description as string}
        touched={touched.description}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        style={styles.textArea}
        containerStyle={styles.textAreaContainer}
      />

      {/* Owner Assignment (Admin Only) */}
      {authStore.isAdmin && (
        <View style={styles.assignmentSection}>
          <View style={styles.sectionHeader}>
            <View>
              <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Assign Owner</AppText>
              <AppText variant="small" style={{ color: theme.subtext }}>Select the property owner</AppText>
            </View>
            <View style={[styles.adminBadge, { backgroundColor: theme.primary + '15' }]}>
              <AppText variant="tiny" weight="bold" style={{ color: theme.primary }}>ADMIN</AppText>
            </View>
          </View>
          
          {personStore.loading && personStore.persons.length === 0 ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentScroll}>
              <TouchableOpacity
                key="owner-none"
                activeOpacity={0.7}
                style={[
                  styles.agentCard,
                  { backgroundColor: 'transparent', borderColor: theme.border },
                  !values.owner_person_id && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                ]}
                onPress={() => setFieldValue('owner_person_id', '')}
              >
                <View style={[styles.noneAvatar, { backgroundColor: theme.border + '50' }]}>
                  <Ionicons name="person-outline" size={24} color={theme.subtext} />
                </View>
                <AppText variant="tiny" weight="bold" style={{ color: !values.owner_person_id ? theme.text : theme.subtext }}>Current User</AppText>
              </TouchableOpacity>

              {personStore.persons.map((person, index) => {
                const personId = String(person.person_id || person.user_id || person.id || '');
                const isActive = values.owner_person_id === personId;
                return (
                  <TouchableOpacity
                    key={`owner-${personId || index}`}
                    activeOpacity={0.7}
                    style={[
                      styles.agentCard,
                      { backgroundColor: 'transparent', borderColor: theme.border },
                      isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
                    ]}
                    onPress={() => setFieldValue('owner_person_id', personId)}
                  >
                    <Avatar user={person} size="md" />
                    <AppText variant="tiny" weight="bold" style={{ color: isActive ? theme.text : theme.subtext }} numberOfLines={1}>
                      {person.full_name?.split(' ')[0] || 'Unknown'}
                    </AppText>
                    <AppText variant="tiny" weight="medium" style={{ color: theme.subtext }}>Owner</AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {renderError('owner_person_id')}
        </View>
      )}

      {/* Assign Agent Section Redesign */}
      <View style={styles.modernAssignmentSection}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="h2" weight="bold" style={{ color: theme.text }}>Assign Agent (Optional)</AppText>
            <AppText variant="small" style={{ color: theme.subtext }}>Select an agent to manage this property.</AppText>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modernAgentScroll}>
          {/* NONE Option */}
          <TouchableOpacity
            key="agent-none"
            activeOpacity={0.7}
            style={styles.circularAgentContainer}
            onPress={() => setFieldValue('agent_id', '')}
          >
            <View style={[
              styles.circularAvatarWrapper, 
              { borderColor: !values.agent_id ? theme.primary : 'transparent' }
            ]}>
              <View style={[styles.noneCircle, { backgroundColor: theme.border + '30' }]}>
                <MaterialCommunityIcons 
                  name="account-off-outline" 
                  size={24} 
                  color={!values.agent_id ? theme.primary : theme.subtext} 
                />
              </View>
              {!values.agent_id && (
                <View style={[styles.miniCheckBadge, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>
            <AppText variant="tiny" weight={!values.agent_id ? "bold" : "medium"} style={{ 
              color: !values.agent_id ? theme.primary : theme.subtext, 
              marginTop: 8,
              textAlign: 'center'
            }}>None</AppText>
          </TouchableOpacity>

          {/* Agents List */}
          {personStore.agents.map((agent, index) => {
            const agentId = String(agent.person_id || agent.user_id || agent.id || '');
            const isActive = values.agent_id === agentId;
            const currentUserId = authStore.user?.person_id || authStore.user?.user_id || authStore.user?.id;
            const isMe = String(currentUserId) === agentId;
            
            return (
              <TouchableOpacity
                key={`agent-${agentId || index}`}
                activeOpacity={0.7}
                style={styles.circularAgentContainer}
                onPress={() => setFieldValue('agent_id', agentId)}
              >
                <View style={[
                  styles.circularAvatarWrapper, 
                  { borderColor: isActive ? theme.primary : 'transparent' }
                ]}>
                  <Avatar user={agent} size="lg" />
                  {isActive && (
                    <View style={[styles.miniCheckBadge, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </View>
                <AppText variant="tiny" weight={isActive ? "bold" : "medium"} style={{ 
                  color: isActive ? theme.primary : theme.text, 
                  marginTop: 8,
                  textAlign: 'center'
                }} numberOfLines={1}>
                  {isMe ? 'Me' : agent.full_name?.split(' ')[0]}
                </AppText>
                {isMe && (
                  <View style={[styles.meTag, { backgroundColor: theme.primary + '15' }]}>
                    <AppText variant="tiny" style={{ color: theme.primary, fontSize: 8, fontWeight: 'bold' }}>AUTO</AppText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {renderError('agent_id')}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { 
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionSubtitle: { 
    marginBottom: 20,
    marginTop: 2,
  },
  inputGroup: { 
    marginBottom: 20,
    gap: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  errorText: { 
    marginTop: 4, 
    marginLeft: 4,
  },
  modernAssignmentSection: {
    marginTop: 24,
    marginBottom: 10,
  },
  modernAgentScroll: {
    paddingVertical: 12,
    gap: 20,
  },
  circularAgentContainer: {
    alignItems: 'center',
    width: 70,
  },
  circularAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  noneCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  miniCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  meTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
});

export default StepBasicInfo;
