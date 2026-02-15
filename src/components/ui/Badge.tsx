import { StyleSheet, Text, View } from 'react-native'

import { borderRadius, colors, fontSize, spacing } from '@/lib/theme'

type BadgeVariant = 'success' | 'warning' | 'error' | 'default'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantColors = {
  success: { background: '#dcfce7', text: '#166534' },
  warning: { background: '#fef9c3', text: '#854d0e' },
  error: { background: '#fee2e2', text: '#991b1b' },
  default: { background: colors.surface, text: colors.textSecondary },
} as const

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const variantColor = variantColors[variant]

  return (
    <View style={[styles.badge, { backgroundColor: variantColor.background }]}>
      <Text style={[styles.text, { color: variantColor.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
})
