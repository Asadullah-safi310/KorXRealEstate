import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';

export default function HelpScreen() {
  const router = useRouter();
  const theme = useThemeColor();

  const handleCall = () => {
    Linking.openURL('tel:+93700000000');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@etimad.af');
  };

  const SupportCard = ({ icon, title, subtitle, onPress, color }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: (color || theme.primary) + '15' }]}>
        <Ionicons name={icon} size={24} color={color || theme.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.border} />
    </TouchableOpacity>
  );

  return (
    <ScreenLayout backgroundColor={theme.background} scrollable>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help Center</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: theme.primary + '10' }]}>
            <MaterialCommunityIcons name="face-agent" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>How can we help you?</Text>
          <Text style={[styles.heroSubtitle, { color: theme.subtext }]}>
            Our team is here to assist you with any questions or issues regarding the Etimad Real Estate platform.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Support</Text>
        <View style={styles.supportGrid}>
          <SupportCard 
            icon="call-outline" 
            title="Customer Support" 
            subtitle="+93 700 000 000" 
            onPress={handleCall}
          />
          <SupportCard 
            icon="mail-outline" 
            title="Email Inquiry" 
            subtitle="support@etimad.af" 
            onPress={handleEmail}
            color="#10b981"
          />
          <SupportCard 
            icon="chatbubbles-outline" 
            title="Live Chat" 
            subtitle="Wait time: ~5 mins" 
            onPress={() => {}}
            color="#f59e0b"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32 }]}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {[
            { q: 'How to list a property?', a: 'Go to the Properties tab and click the "+" button in the top right.' },
            { q: 'Is registration free?', a: 'Yes, basic registration and browsing is completely free.' },
            { q: 'How to contact an agent?', a: 'Click on any property to see the assigned agent and their contact info.' }
          ].map((faq, index) => (
            <TouchableOpacity 
              key={index}
              style={[styles.faqItem, { borderBottomColor: theme.border }]}
              activeOpacity={0.6}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.q}</Text>
                <Ionicons name="add" size={20} color={theme.subtext} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoBanner, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            Office Hours: Sat - Thu, 8:00 AM - 5:00 PM (AFT)
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  supportGrid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  faqList: {
    marginBottom: 32,
  },
  faqItem: {
    paddingVertical: 18,
    borderBottomWidth: 1.5,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
