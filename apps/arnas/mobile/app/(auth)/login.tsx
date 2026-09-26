import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { HardDrive, Server, Mail, Lock, ShieldCheck } from 'lucide-react-native';

export default function LoginScreen() {
  const { login, serverUrl, setServerUrl } = useAuthStore();

  const [url, setUrl] = useState(serverUrl);

  React.useEffect(() => {
    if (serverUrl) {
      setUrl(serverUrl);
    }
  }, [serverUrl]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    setError(null);
    try {
      const cleanUrl = url.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/health`);
      if (res.ok) {
        setConnectionStatus('Connected to ARNAS Server!');
        await setServerUrl(cleanUrl);
      } else {
        setError(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      setError('Cannot reach server. Verify IP, Wi-Fi or Tailscale connection.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password, url);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <HardDrive size={38} color={colors.accent} />
          </View>
          <Text style={styles.title}>ARNAS</Text>
          <Text style={styles.subtitle}>Autonomous Private Family Cloud</Text>
        </View>

        {/* Login Card */}
        <Card style={styles.card} elevated>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {connectionStatus && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{connectionStatus}</Text>
            </View>
          )}

          {/* Server URL Input */}
          <Text style={styles.inputLabel}>Server Endpoint (LAN / Tailscale)</Text>
          <View style={styles.inputRow}>
            <Server size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={url}
              onChangeText={setUrl}
              placeholder="http://192.168.1.100:8080"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Button
            title="Test Server Connection"
            variant="secondary"
            size="sm"
            onPress={handleTestConnection}
            loading={testingConnection}
            style={styles.testBtn}
          />

          {/* Email Input */}
          <Text style={styles.inputLabel}>Family Account Email</Text>
          <View style={styles.inputRow}>
            <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="you@family.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputRow}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          {/* Submit */}
          <Button
            title="Connect & Sign In"
            variant="primary"
            size="md"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
            icon={<ShieldCheck size={20} color={colors.textPrimary} />}
          />
        </Card>

        {/* Security Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            End-to-End Encrypted • 100% On-Premise Storage
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  testBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  loginBtn: {
    marginTop: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
