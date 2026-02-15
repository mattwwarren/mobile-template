import Constants from 'expo-constants'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { fetchApi } from '@/api/client'
import { useAuth } from '@/auth'
import { Button, Card } from '@/components/ui'
import { borderRadius, colors, fontSize, spacing } from '@/lib/theme'

export default function SettingsScreen() {
  const { user, logout } = useAuth()
  const [healthStatus, setHealthStatus] = useState<string | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  const handleHealthCheck = useCallback(async () => {
    setHealthLoading(true)
    setHealthStatus(null)
    try {
      const result = await fetchApi<{ status: string }>('/health')
      setHealthStatus(`OK: ${result.status}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setHealthStatus(`Error: ${message}`)
    } finally {
      setHealthLoading(false)
    }
  }, [])

  const appVersion = Constants.expoConfig?.version ?? 'unknown'
  const appName = Constants.expoConfig?.name ?? 'Mobile Template'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        {user ? (
          <View style={styles.userInfo}>
            {user.name ? <Text style={styles.userName}>{user.name}</Text> : null}
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        ) : (
          <Text style={styles.noUser}>Not signed in</Text>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>API Status</Text>
        <Button
          title="Check API Health"
          onPress={() => void handleHealthCheck()}
          variant="secondary"
          loading={healthLoading}
        />
        {healthStatus ? (
          <Text
            style={[
              styles.healthStatus,
              healthStatus.startsWith('OK') ? styles.healthOk : styles.healthError,
            ]}
          >
            {healthStatus}
          </Text>
        ) : null}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Name</Text>
          <Text style={styles.aboutValue}>{appName}</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>{appVersion}</Text>
        </View>
      </Card>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userInfo: {
    paddingVertical: spacing.xs,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  noUser: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  healthStatus: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  healthOk: {
    color: colors.success,
  },
  healthError: {
    color: colors.error,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  aboutLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  aboutValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
