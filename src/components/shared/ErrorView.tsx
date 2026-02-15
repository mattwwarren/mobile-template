import { StyleSheet, Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { colors, fontSize, spacing } from '@/lib/theme'

interface ErrorViewProps {
  error: Error
  onRetry?: () => void
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.message}>{error.message}</Text>
      {onRetry ? (
        <View style={styles.buttonWrapper}>
          <Button title="Try Again" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  icon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing.md,
    width: 64,
    height: 64,
    lineHeight: 64,
    textAlign: 'center',
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    overflow: 'hidden',
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonWrapper: {
    minWidth: 120,
  },
})
