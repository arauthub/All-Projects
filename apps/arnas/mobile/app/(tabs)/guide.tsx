import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/stores/authStore';
import {
  ShieldAlert,
  ShieldCheck,
  HardDrive,
  Layers,
  Activity,
  FolderTree,
  Wifi,
  Lock,
  Share2,
  Trash2,
  CloudLightning,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Server,
  User,
  Users,
  Compass,
  ArrowRight,
  Database,
  Cpu,
  RefreshCw,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react-native';
import { ExternalDriveModal } from '../../src/components/ExternalDriveModal';
import { StorageClusterModal } from '../../src/components/StorageClusterModal';
import { NASStorageHealthModal } from '../../src/components/NASStorageHealthModal';
import { LocationGeofenceModal } from '../../src/components/LocationGeofenceModal';
import { E2EESecurityModal } from '../../src/components/E2EESecurityModal';
import { RecycleBinModal } from '../../src/components/RecycleBinModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GuideItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  steps: { title: string; desc: string; tip?: string }[];
  actionLabel?: string;
  actionModal?: 'drives' | 'cluster' | 'health' | 'geofence' | 'e2ee' | 'trash';
  role: 'ADMIN' | 'USER' | 'BOTH';
  badge: string;
  badgeColor: string;
}

export default function SiteGuideScreen() {
  const { user } = useAuthStore();
  const actualRole = user?.role || 'ADMIN';

  // Role simulation toggle for previewing flows
  const [activeRoleView, setActiveRoleView] = useState<'ADMIN' | 'MEMBER'>(
    actualRole === 'ADMIN' ? 'ADMIN' : 'MEMBER'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('admin-ext-drive');

  // Modals for live test actions from the guide
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showE2EEModal, setShowE2EEModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleLaunchModal = (modalName?: string) => {
    if (modalName === 'drives') setShowDriveModal(true);
    else if (modalName === 'cluster') setShowClusterModal(true);
    else if (modalName === 'health') setShowHealthModal(true);
    else if (modalName === 'geofence') setShowGeofenceModal(true);
    else if (modalName === 'e2ee') setShowE2EEModal(true);
    else if (modalName === 'trash') setShowTrashModal(true);
  };

  const adminGuides: GuideItem[] = [
    {
      id: 'admin-ext-drive',
      title: 'External HDD/SSD Hot-Plugging & Wireless NAS Routing',
      category: 'Storage Hardware',
      summary: 'Attach USB 3.2 or Thunderbolt SSDs directly to server and route wireless mobile uploads to it.',
      badge: 'HARDWARE NAS',
      badgeColor: colors.cyan,
      role: 'ADMIN',
      actionLabel: 'Open Drive Manager',
      actionModal: 'drives',
      steps: [
        {
          title: '1. Connect Drive & Scan Volumes',
          desc: 'Plug your external drive into the server. ARNAS scans `/Volumes` (macOS) or `/media`, `/mnt` (Linux) to discover connected storage.',
          tip: 'APFS, exFAT, NTFS, and ext4 filesystems are automatically inspected with `statfs` capacity.',
        },
        {
          title: '2. Canary File Verification',
          desc: 'ARNAS creates `.arnas_canary.json` at the root of the external drive to test real write, read, and delete permissions before mounting.',
        },
        {
          title: '3. Auto-Provision Directory Layout',
          desc: 'The storage engine generates dedicated directories: `families/`, `staging/`, `thumbnails/`, and `vault/` directly on the drive.',
        },
        {
          title: '4. Set as Primary Wireless Sync Target',
          desc: 'Enable "Set as Primary Wireless Target". All mobile phones syncing on trusted Wi-Fi will stream and re-assemble chunks directly onto this external SSD.',
        },
        {
          title: '5. Benchmark & Safe Ejection',
          desc: 'Execute real-time IOPS/MBps stress tests. When disconnecting, click "Safely Eject" to flush buffered write cache to prevent corruption.',
        },
      ],
    },
    {
      id: 'admin-cluster',
      title: 'Multi-Node Redundancy & S3 Failover Architecture',
      category: 'Cluster Topology',
      summary: 'Configure local NVMe primary tiers, secondary USB backup drives, and S3-compatible cloud hot standbys.',
      badge: 'CLUSTER REDUNDANCY',
      badgeColor: colors.primaryLight,
      role: 'ADMIN',
      actionLabel: 'Configure Cluster Nodes',
      actionModal: 'cluster',
      steps: [
        {
          title: '1. Register Node Hierarchy',
          desc: 'Navigate to Multi-Node Storage Cluster. Define Priority 1 for local high-speed SSD, Priority 2 for attached HDD, and Priority 3 for AWS S3 / MinIO.',
        },
        {
          title: '2. Connection & Credential Verification',
          desc: 'Enter S3 Endpoint, Bucket, Region, Access Key, and Secret Key. The server executes a live ping test (`POST /api/v1/storage/test`) before committing.',
        },
        {
          title: '3. Asynchronous Replication Daemon',
          desc: 'Every file chunk ingested into the cluster is placed into the replication queue to guarantee 2-way or 3-way multi-node copies.',
        },
        {
          title: '4. Zero-Downtime Read Failover',
          desc: 'If the primary drive is unplugged or offline, read requests dynamically fail over to healthy replica nodes with `X-ARNAS-Failover: 1`.',
        },
      ],
    },
    {
      id: 'admin-health',
      title: 'S.M.A.R.T. Telemetry & Drive Health Monitoring',
      category: 'Diagnostics',
      summary: 'Inspect RAID pools, real-time temperature sensors, I/O throughput, and sector integrity.',
      badge: 'TELEMETRY & S.M.A.R.T.',
      badgeColor: colors.success,
      role: 'ADMIN',
      actionLabel: 'View Live NAS Telemetry',
      actionModal: 'health',
      steps: [
        {
          title: '1. ZFS / RAID Pool Status',
          desc: 'Monitor health states (ONLINE, DEGRADED, FAULTED). Check RAID-1 mirror and parity integrity.',
        },
        {
          title: '2. Thermal Throttling Guard',
          desc: 'Sensors monitor drive temperature in real-time. If NVMe temperatures exceed 65°C, background scrubbers pause to prevent heat degradation.',
        },
        {
          title: '3. Volume Utilization Breakdown',
          desc: 'Visualize capacity breakdown across Photos, 4K Videos, Encrypted Vaults, and System Overhead.',
        },
      ],
    },
    {
      id: 'admin-rbac',
      title: 'Enterprise RBAC, Quotas & Content Isolation',
      category: 'Security & Access',
      summary: 'Strict mathematical user isolation, storage quota limits, and administrative governance.',
      badge: 'TENANT ISOLATION',
      badgeColor: '#F59E0B',
      role: 'ADMIN',
      steps: [
        {
          title: '1. Role Separation (Admin vs Normal Member)',
          desc: 'Admins control storage mount points, hardware drives, and cluster configuration. Standard users only access their personal files and folders.',
        },
        {
          title: '2. Multi-Tenant User Isolation',
          desc: 'Each member’s files are stored in isolated namespaces. No user can view or stream another user’s content unless explicitly shared.',
        },
        {
          title: '3. Quota Enforcement',
          desc: 'Upload chunk streams verify incoming size against `storageQuotaBytes`. If exceeded, uploads are immediately rejected with 403 Forbidden.',
        },
        {
          title: '4. Immutable Audit Trail',
          desc: 'Every configuration change, drive attachment, share creation, and login is recorded in `audit_logs` with IP, timestamp, and user agent.',
        },
      ],
    },
    {
      id: 'admin-deploy',
      title: '1-Click Cloud Deployment (GCP & AWS)',
      category: 'DevOps & Cloud',
      summary: 'Automated single-command production deployment to Google Cloud Run / GKE or AWS ECS Fargate.',
      badge: '1-CLICK CLOUD DEPLOY',
      badgeColor: colors.accent,
      role: 'ADMIN',
      steps: [
        {
          title: '1. Google Cloud Deployment (Cloud Run + Cloud SQL)',
          desc: 'Run `./scripts/deploy-gcp.sh`. Automatically creates PostgreSQL instance, configures GCS bucket, builds multi-stage Docker container, and deploys with HTTPS.',
        },
        {
          title: '2. AWS Deployment (ECS Fargate + RDS + S3)',
          desc: 'Run `./scripts/deploy-aws.sh`. Provisions RDS PostgreSQL, S3 bucket, ECS task definition with IAM security roles, and Application Load Balancer.',
        },
        {
          title: '3. Zero Secrets & Security Hardening',
          desc: 'Pre-flight `./scripts/presubmit.sh` audits all code for secrets, validates schema, and runs end-to-end Vitest verification.',
        },
      ],
    },
  ];

  const userGuides: GuideItem[] = [
    {
      id: 'user-files',
      title: 'Personal Cloud Explorer & Folder Organization',
      category: 'File Management',
      summary: 'Manage personal photos, documents, and folders with end-to-end privacy and instant search.',
      badge: 'CLOUD EXPLORER',
      badgeColor: colors.accent,
      role: 'USER',
      steps: [
        {
          title: '1. Exploring Personal Folders',
          desc: 'Open the "Files" tab. Browse your personal folders, photos, videos, and documents with breadcrumb navigation.',
          tip: 'Your files are 100% private. Other family members or colleagues cannot see your personal files.',
        },
        {
          title: '2. Creating Folders & Uploading Media',
          desc: 'Tap "New Folder" in the top toolbar to create subfolders. Tap "Upload" to select photos, videos, or documents from your phone.',
        },
        {
          title: '3. Starred Favorites & Search',
          desc: 'Star important files to quickly access them in the "Starred ⭐" filter tab. Use the search bar to find files by name.',
        },
      ],
    },
    {
      id: 'user-sync',
      title: 'Wireless Camera Roll Auto-Sync with Geofencing',
      category: 'Mobile Backup',
      summary: 'Automatically backup newly taken photos and videos to the NAS without consuming mobile data.',
      badge: 'GEOFENCE & WI-FI',
      badgeColor: colors.success,
      role: 'USER',
      actionLabel: 'Configure Geofence Rules',
      actionModal: 'geofence',
      steps: [
        {
          title: '1. Trusted Location & Wi-Fi Gating',
          desc: 'Auto-sync activates only when connected to your home Wi-Fi inside configured trusted GPS coordinates.',
          tip: 'Protects mobile battery and completely prevents accidental cellular data charges.',
        },
        {
          title: '2. Resumable Chunked Ingest',
          desc: 'Large 4K videos are automatically sliced into 2MB chunks. If your Wi-Fi disconnects, upload resumes right where it left off.',
        },
        {
          title: '3. Battery Preservation',
          desc: 'Enable "Sync Only When Charging" in Settings so backups run quietly overnight while your phone is plugged in.',
        },
      ],
    },
    {
      id: 'user-sharing',
      title: 'Direct User-to-User Sharing & Shared With Me',
      category: 'Collaboration',
      summary: 'Securely share specific files or folders with other users with granular View or Edit permissions.',
      badge: 'GRANULAR SHARING',
      badgeColor: colors.cyan,
      role: 'USER',
      steps: [
        {
          title: '1. Sharing with Another User',
          desc: 'Tap the three-dots (•••) on any file and tap "Share". Select "Share with User" tab and enter recipient’s email address.',
        },
        {
          title: '2. Select Permission Level',
          desc: 'Choose "View & Download" (read-only) or "Can Edit & Manage" (upload and modify). Content remains private to everyone else.',
        },
        {
          title: '3. Viewing "Shared With Me" Files',
          desc: 'In the "Files" tab, tap "Shared With Me 🤝" filter tab to view all documents and photos shared with you by other users.',
        },
        {
          title: '4. Instant Revocation',
          desc: 'File owners can revoke sharing at any time. Revocation takes effect immediately.',
        },
      ],
    },
    {
      id: 'user-e2ee',
      title: 'Zero-Knowledge Client-Side E2EE Vault',
      category: 'Military-Grade Privacy',
      summary: 'Client-side AES-256-GCM encryption where files are encrypted on your phone before transmission.',
      badge: 'AES-256-GCM VAULT',
      badgeColor: colors.primaryLight,
      role: 'USER',
      actionLabel: 'View E2EE Security Keys',
      actionModal: 'e2ee',
      steps: [
        {
          title: '1. Client-Side Encryption',
          desc: 'When uploading to "E2EE Vault", files are encrypted directly in phone memory using AES-256-GCM with PBKDF2 derived keys.',
        },
        {
          title: '2. Zero-Knowledge Server',
          desc: 'The ARNAS server and storage drives only store raw encrypted ciphertext. Server operators cannot read your vault content.',
        },
        {
          title: '3. Passphrase Recovery',
          desc: 'Save your 12-word recovery passphrase in a secure location. You hold the only cryptographic keys to decrypt your files.',
        },
      ],
    },
    {
      id: 'user-trash',
      title: 'Recycle Bin & 30-Day Version Recovery',
      category: 'Accident Recovery',
      summary: 'Soft-deleted files are preserved for 30 days before permanent purging.',
      badge: 'RECYCLE BIN',
      badgeColor: colors.danger,
      role: 'USER',
      actionLabel: 'Open Recycle Bin',
      actionModal: 'trash',
      steps: [
        {
          title: '1. Safe Soft-Deletion',
          desc: 'Deleting a file sends it to your Recycle Bin instead of immediate destruction.',
        },
        {
          title: '2. 1-Click Restoration',
          desc: 'Open "Trash" in Files or Settings. Tap "Restore" to return the item to its original folder hierarchy.',
        },
        {
          title: '3. Freeing Quota',
          desc: 'Empty your Recycle Bin to permanently release your allocated storage quota.',
        },
      ],
    },
  ];

  const activeGuides = (activeRoleView === 'ADMIN' ? adminGuides : userGuides).filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.steps.some((s) => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Dynamic Authority Hero Banner */}
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View
            style={[
              styles.roleIconBox,
              {
                backgroundColor:
                  activeRoleView === 'ADMIN'
                    ? 'rgba(6, 182, 212, 0.15)'
                    : 'rgba(99, 102, 241, 0.15)',
              },
            ]}
          >
            {activeRoleView === 'ADMIN' ? (
              <Server size={24} color={colors.accent} />
            ) : (
              <User size={24} color={colors.primaryLight} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.heroTitle}>ARNAS Site Guide & Flow Center</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              {activeRoleView === 'ADMIN'
                ? 'Administrator Authority • Full Hardware NAS, Cluster & Drive Flows'
                : 'Standard User Guidelines • Personal Cloud, Auto-Sync & File Security'}
            </Text>
          </View>
        </View>

        {/* Role Switcher for Interactive Flow Testing */}
        <View style={styles.roleSwitcherContainer}>
          <Text style={styles.roleSwitcherLabel}>Guide Perspective:</Text>
          <View style={styles.roleToggleGroup}>
            <TouchableOpacity
              style={[
                styles.roleToggleBtn,
                activeRoleView === 'ADMIN' && styles.roleToggleBtnActive,
              ]}
              onPress={() => {
                setActiveRoleView('ADMIN');
                setExpandedId('admin-ext-drive');
              }}
              activeOpacity={0.8}
            >
              <Server size={14} color={activeRoleView === 'ADMIN' ? colors.accent : colors.textMuted} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.roleToggleText,
                  activeRoleView === 'ADMIN' && styles.roleToggleTextActive,
                ]}
              >
                Administrator Flow 👑
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleToggleBtn,
                activeRoleView === 'MEMBER' && styles.roleToggleBtnActive,
              ]}
              onPress={() => {
                setActiveRoleView('MEMBER');
                setExpandedId('user-files');
              }}
              activeOpacity={0.8}
            >
              <User size={14} color={activeRoleView === 'MEMBER' ? colors.primaryLight : colors.textMuted} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.roleToggleText,
                  activeRoleView === 'MEMBER' && styles.roleToggleTextActive,
                ]}
              >
                Normal User Guidelines 👤
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actual Logged In User Pill */}
        <View style={styles.loggedInInfoRow}>
          <Text style={styles.loggedInInfoText}>
            Logged in as <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{user?.email || 'abhijeet@example.com'}</Text> ({actualRole} authority)
          </Text>
        </View>
      </Card>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeRoleView === 'ADMIN' ? 'storage configs, drives, or S.M.A.R.T...' : 'file guides, auto-sync, or E2EE...'}`}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Guide Flow Items */}
      <View style={styles.guidesContainer}>
        {activeGuides.map((guide) => {
          const isExpanded = expandedId === guide.id;
          return (
            <Card key={guide.id} style={styles.guideCard}>
              <TouchableOpacity
                style={styles.guideHeader}
                onPress={() => toggleExpand(guide.id)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.guideMetaRow}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: `${guide.badgeColor}20` },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: guide.badgeColor }]}>
                        {guide.badge}
                      </Text>
                    </View>
                    <Text style={styles.categoryText}>{guide.category}</Text>
                  </View>
                  <Text style={styles.guideTitle}>{guide.title}</Text>
                  <Text style={styles.guideSummary}>{guide.summary}</Text>
                </View>
                <View style={styles.expandIconBox}>
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />

                  <Text style={styles.stepsHeading}>STEP-BY-STEP WORKFLOW:</Text>

                  {guide.steps.map((step, idx) => (
                    <View key={idx} style={styles.stepRow}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDesc}>{step.desc}</Text>
                        {step.tip && (
                          <View style={styles.tipBox}>
                            <Text style={styles.tipText}>💡 {step.tip}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}

                  {guide.actionLabel && (
                    <Button
                      title={guide.actionLabel}
                      variant="primary"
                      size="sm"
                      onPress={() => handleLaunchModal(guide.actionModal)}
                      icon={<ExternalLink size={15} color={colors.textPrimary} />}
                      style={styles.actionBtn}
                    />
                  )}
                </View>
              )}
            </Card>
          );
        })}
      </View>

      {/* Quick Architecture Summary Card */}
      <Card style={styles.archCard}>
        <View style={styles.archHeader}>
          <Database size={18} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={styles.archTitle}>Enterprise NAS Architecture Pipeline</Text>
        </View>
        <Text style={styles.archDesc}>
          • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Mobile App (iOS/Android/Web)</Text>: Geofenced background queue, delta hashing, client-side AES-256 encryption.
        </Text>
        <Text style={styles.archDesc}>
          • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>ARNAS Fastify Engine</Text>: Resumable chunk re-assembly, zero-knowledge metadata, automatic S3 replication daemon.
        </Text>
        <Text style={styles.archDesc}>
          • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Storage Nodes & External Drives</Text>: Direct USB 3.2 NVMe/HDD ingestion, S.M.A.R.T. thermal telemetry, failover cluster.
        </Text>
      </Card>

      {/* Interactive Modals */}
      <ExternalDriveModal
        visible={showDriveModal}
        onClose={() => setShowDriveModal(false)}
      />
      <StorageClusterModal
        visible={showClusterModal}
        onClose={() => setShowClusterModal(false)}
      />
      <NASStorageHealthModal
        visible={showHealthModal}
        onClose={() => setShowHealthModal(false)}
      />
      <LocationGeofenceModal
        visible={showGeofenceModal}
        onClose={() => setShowGeofenceModal(false)}
      />
      <E2EESecurityModal
        visible={showE2EEModal}
        onClose={() => setShowE2EEModal(false)}
      />
      <RecycleBinModal
        visible={showTrashModal}
        onClose={() => setShowTrashModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 18,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  roleSwitcherContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roleSwitcherLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  roleToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 10,
    padding: 3,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  roleToggleBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
  },
  roleToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  roleToggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  loggedInInfoRow: {
    marginTop: 12,
  },
  loggedInInfoText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },
  guidesContainer: {
    gap: 12,
  },
  guideCard: {
    padding: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideSummary: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  expandIconBox: {
    padding: 4,
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  stepsHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  tipBox: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  tipText: {
    fontSize: 11,
    color: colors.accent,
    lineHeight: 15,
  },
  actionBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  archCard: {
    padding: 16,
    marginTop: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  archHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  archTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  archDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
});
