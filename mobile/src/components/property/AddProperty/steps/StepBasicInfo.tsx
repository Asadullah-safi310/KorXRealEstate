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

const SUGGESTED_TITLES = [
  'Modern Apartment',
  'Family Home',
  'Luxury Villa',
  'City Studio',
  'Cozy Flat',
  'Prime Location Home',
  'Modern 3-Bedroom Apartment in Prime Location',
  'Spacious Family House with Private Garden',
  'Luxury Villa with City View',
  'Affordable Studio Near Main Road',
  'Newly Renovated Home Ready to Move In',
];

const StepBasicInfo = observer(({ isStandalone, isEditing, isCreatingParent }: any) => {
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();
  const theme = useThemeColor();
  const selectedAgentId = values.agent_id ? String(values.agent_id) : '';
  const creatorUserId = values.created_by_user_id ? String(values.created_by_user_id) : '';
  const currentPersonId = authStore.user?.person_id || authStore.user?.user_id || authStore.user?.id;
  const isParentContainerFlow = !!isCreatingParent || !!values.is_parent || values.record_kind === 'container';
  const shouldAutoAssignAgent =
    authStore.user?.role === 'agent' &&
    !!currentPersonId &&
    (!!isStandalone || isParentContainerFlow);
  // Hide agent picker when agent is auto-assigned in standalone create,
  // parent-container flow (auto agent), and in edit mode (preselected/default value should not be changed here).
  const shouldHideAssignAgentSection =
    !isEditing ||
    shouldAutoAssignAgent ||
    (!authStore.isAdmin && !!isEditing) ||
    (isParentContainerFlow && !authStore.isAdmin);

  useEffect(() => {
    if (!shouldHideAssignAgentSection && personStore.agents.length === 0) personStore.fetchAgents();

    // Standalone + parent-container flows: listing agent is always the logged-in agent.
    if (shouldAutoAssignAgent) {
      const normalizedCurrentAgentId = String(currentPersonId);
      if (values.agent_id !== normalizedCurrentAgentId) {
        setFieldValue('agent_id', normalizedCurrentAgentId);
      }
      return;
    }

    // Auto-select current user if they are an agent and no agent is selected yet (initial state is null)
    if (values.agent_id === null) {
      if (authStore.user?.role === 'agent') {
        if (currentPersonId) {
          setFieldValue('agent_id', String(currentPersonId));
        }
      } else {
        setFieldValue('agent_id', ''); // Default to None for non-agents
      }
    }

    // Admin edit flow fallback: if agent is empty, preselect creator as default.
    if (authStore.isAdmin && isEditing && !selectedAgentId && creatorUserId) {
      setFieldValue('agent_id', creatorUserId);
    }
  }, [setFieldValue, values.agent_id, shouldAutoAssignAgent, shouldHideAssignAgentSection, currentPersonId, authStore.isAdmin, isEditing, selectedAgentId, creatorUserId]);

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
        rightAdornment={values.title ? (
          <TouchableOpacity
            onPress={() => setFieldValue('title', '')}
            style={[styles.clearTitleBtn, { backgroundColor: theme.border + '40' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={14} color={theme.subtext} />
          </TouchableOpacity>
        ) : null}
      />
      <View style={styles.suggestionsWrapper}>
        <AppText variant="tiny" style={{ color: theme.subtext, marginBottom: 6 }}>
          Suggested titles:
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsList}
        >
          {SUGGESTED_TITLES.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => setFieldValue('title', suggestion)}
              style={[styles.suggestionItem, { borderColor: theme.border, backgroundColor: theme.card }]}
              activeOpacity={0.7}
            >
              <AppText variant="tiny" style={{ color: theme.primary }} numberOfLines={1}>
                {suggestion}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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

      <AnimatedFormInput
        label="Owner Name (Optional)"
        placeholder="Enter the name of the property owner"
        value={values.owner_name}
        onChangeText={(t) => setFieldValue('owner_name', t)}
        error={errors.owner_name as string}
        touched={touched.owner_name}
        icon={<MaterialCommunityIcons name="account" size={20} color={theme.subtext} />}
        rightAdornment={values.owner_name ? (
          <TouchableOpacity
            onPress={() => setFieldValue('owner_name', '')}
            style={[styles.clearTitleBtn, { backgroundColor: theme.border + '40' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={14} color={theme.subtext} />
          </TouchableOpacity>
        ) : null}
      />

      {!shouldHideAssignAgentSection && (
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
              const agentId = String(agent.user_id || agent.person_id || agent.id || '');
              const isActive = selectedAgentId === agentId;
              const currentUserId = authStore.user?.user_id || authStore.user?.person_id || authStore.user?.id;
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
      )}
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
  suggestionsWrapper: {
    marginTop: -8,
    marginBottom: 16,
  },
  suggestionsList: {
    gap: 8,
    paddingRight: 20,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 250,
  },
  clearTitleBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernAssignmentSection: {
    marginTop: 24,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
