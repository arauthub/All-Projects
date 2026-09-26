import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  Cloud,
  BatteryCharging,
  Layers,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  X,
} from 'lucide-react-native';
import { theme } from '../theme';

const TUTORIAL_SEEN_KEY = 'arnas_tutorial_completed_v1';

interface UserTutorialModalProps {
  visible?: boolean;
  onClose?: () => void;
  isManualLaunch?: boolean;
}

interface TutorialSlide {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  badge: string;
}

export const UserTutorialModal: React.FC<UserTutorialModalProps> = ({
  visible: controlledVisible,
  onClose,
  isManualLaunch = false,
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

  useEffect(() => {
    // If not controlled externally, check if first-time user
    if (controlledVisible === undefined) {
      checkFirstLaunch();
    }
  }, [controlledVisible]);

  const checkFirstLaunch = async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const seen = window.localStorage.getItem(TUTORIAL_SEEN_KEY);
        if (!seen) setInternalVisible(true);
        return;
      }
      const seen = await SecureStore.getItemAsync(TUTORIAL_SEEN_KEY);
      if (!seen) {
        setInternalVisible(true);
      }
    } catch {
      // fallback
    }
  };

  const handleFinish = async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
      } else {
        await SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, 'true');
      }
    } catch {
      // ignore
    }

    if (onClose) {
      onClose();
    } else {
      setInternalVisible(false);
    }
    setCurrentSlide(0);
  };

  const slides: TutorialSlide[] = [
    {
      title: 'Autonomous Cloud & Mobile Sync',
      subtitle: 'Self-Hosted Private Family Drive',
      description:
        'Seamlessly backup your mobile camera roll and documents with SHA-256 deduplication and resumable multi-chunk uploads. Your family data stays entirely under your control.',
      icon: <Cloud size={44} color="#6366F1" />,
      accentColor: '#6366F1',
      badge: 'RESUMABLE SYNC',
    },
    {
      title: 'Intelligent Sentinel Engine',
      subtitle: 'Battery & Wi-Fi Protection',
      description:
        'Background sync adapts automatically to your phone state: upload on unmetered Wi-Fi only, pause below 20% battery, and sync overnight while charging.',
      icon: <BatteryCharging size={44} color="#06B6D4" />,
      accentColor: '#06B6D4',
      badge: 'BATTERY POLICIES',
    },
    {
      title: 'Multi-Server Storage Cluster',
      subtitle: 'Enterprise Redundancy & Failover',
      description:
        'Attach secondary NAS volumes and S3-compatible buckets (MinIO, AWS S3, Cloudflare R2). File writes ingest instantly to primary with background fan-out replication and auto failover reads.',
      icon: <Layers size={44} color="#818CF8" />,
      accentColor: '#818CF8',
      badge: 'MULTI-NODE CLUSTERING',
    },
    {
      title: 'Zero-Knowledge E2EE Vault',
      subtitle: 'Client-Side Mathematical Privacy',
      description:
        'Files are encrypted on your device using AES-256-GCM before transmission. Neither servers nor administrators have keys to view your data, protected by a 12-word recovery mnemonic.',
      icon: <ShieldCheck size={44} color="#10B981" />,
      accentColor: '#10B981',
      badge: 'AES-256-GCM ENCRYPTED',
    },
  ];

  const current = slides[currentSlide];

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleFinish}>
      <View style={styles.modalOverlay}>
        <View style={styles.cardContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.stepBadge}>
              <Sparkles size={12} color={current.accentColor} style={{ marginRight: 4 }} />
              <Text style={[styles.stepBadgeText, { color: current.accentColor }]}>
                {currentSlide + 1} OF {slides.length} • {current.badge}
              </Text>
            </View>
            <TouchableOpacity onPress={handleFinish} style={styles.closeBtn}>
              <X size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Slide Content */}
          <View style={styles.slideBody}>
            <View style={[styles.iconWrapper, { backgroundColor: `${current.accentColor}20` }]}>
              {current.icon}
            </View>

            <Text style={styles.title}>{current.title}</Text>
            <Text style={[styles.subtitle, { color: current.accentColor }]}>{current.subtitle}</Text>
            <Text style={styles.description}>{current.description}</Text>
          </View>

          {/* Progress Dots */}
          <View style={styles.dotsRow}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === currentSlide && [styles.activeDot, { backgroundColor: current.accentColor }],
                ]}
              />
            ))}
          </View>

          {/* Navigation Controls */}
          <View style={styles.footerRow}>
            {currentSlide > 0 ? (
              <TouchableOpacity
                style={styles.navBtnOutline}
                onPress={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={16} color={theme.colors.textMuted} />
                <Text style={styles.navBtnOutlineText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
                <Text style={styles.skipBtnText}>Skip Tour</Text>
              </TouchableOpacity>
            )}

            {currentSlide < slides.length - 1 ? (
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: current.accentColor }]}
                onPress={() => setCurrentSlide((prev) => prev + 1)}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
                <ChevronRight size={16} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: theme.colors.success }]}
                onPress={handleFinish}
              >
                <Check size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.nextBtnText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: Math.min(width - 40, 420),
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 6,
  },
  slideBody: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 10,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  skipBtnText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  navBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  navBtnOutlineText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
