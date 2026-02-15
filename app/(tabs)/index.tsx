import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Item } from '@/api/types'
import { ErrorView } from '@/components/shared/ErrorView'
import { Badge, Card, LoadingSpinner } from '@/components/ui'
import { useDashboardStats, useItems } from '@/hooks/useItems'
import { borderRadius, colors, fontSize, spacing } from '@/lib/theme'

export default function DashboardScreen() {
  const router = useRouter()
  const statsQuery = useDashboardStats()
  const recentQuery = useItems({ page: 1, size: 5 })

  const handleItemPress = useCallback(
    (id: string) => {
      router.push(`/items/${id}`)
    },
    [router]
  )

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <Pressable
        style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
        onPress={() => handleItemPress(item.id)}
      >
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.listItemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <Badge label={item.status} variant={item.status === 'active' ? 'success' : 'default'} />
      </Pressable>
    ),
    [handleItemPress]
  )

  const keyExtractor = useCallback((item: Item) => item.id, [])

  if (statsQuery.isLoading || recentQuery.isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  if (statsQuery.error) {
    return <ErrorView error={statsQuery.error} onRetry={() => void statsQuery.refetch()} />
  }

  if (recentQuery.error) {
    return <ErrorView error={recentQuery.error} onRetry={() => void recentQuery.refetch()} />
  }

  const stats = statsQuery.data

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.total_items ?? 0}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {stats?.active_items ?? 0}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {stats?.archived_items ?? 0}
          </Text>
          <Text style={styles.statLabel}>Archived</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Recent Items</Text>

      <FlatList
        data={recentQuery.data?.items ?? []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items yet. Create your first item!</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  listContent: {
    gap: spacing.sm,
  },
  listItem: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  listItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listItemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listItemDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
})
