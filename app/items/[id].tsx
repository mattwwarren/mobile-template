import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import { ErrorView } from '@/components/shared/ErrorView'
import { Badge, Button, Card, LoadingSpinner } from '@/components/ui'
import { useDeleteItem, useItem } from '@/hooks/useItems'
import { colors, fontSize, spacing } from '@/lib/theme'

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: item, isLoading, error, refetch } = useItem(id ?? '')
  const deleteItem = useDeleteItem()

  const handleEdit = useCallback(() => {
    Alert.alert('Edit', 'Edit functionality will be added in a future update.')
  }, [])

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!id) return
          deleteItem.mutate(id, {
            onSuccess: () => {
              router.back()
            },
            onError: (err) => {
              Alert.alert('Error', err.message)
            },
          })
        },
      },
    ])
  }, [id, deleteItem, router])

  if (isLoading) {
    return <LoadingSpinner message="Loading item..." />
  }

  if (error) {
    return <ErrorView error={error} onRetry={() => void refetch()} />
  }

  if (!item) {
    return <ErrorView error={new Error('Item not found')} />
  }

  return (
    <>
      <Stack.Screen options={{ title: item.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <Badge label={item.status} variant={item.status === 'active' ? 'success' : 'default'} />
        </View>

        <Card style={styles.descriptionCard}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Card>

        <Card style={styles.metaCard}>
          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Updated</Text>
            <Text style={styles.metaValue}>{new Date(item.updated_at).toLocaleDateString()}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <Button title="Edit" onPress={handleEdit} variant="secondary" />
          </View>
          <View style={styles.actionButton}>
            <Button
              title="Delete"
              onPress={handleDelete}
              variant="danger"
              loading={deleteItem.isPending}
            />
          </View>
        </View>
      </ScrollView>
    </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  descriptionCard: {
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
  description: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  metaCard: {
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metaLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
})
