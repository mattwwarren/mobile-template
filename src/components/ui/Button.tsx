import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

import { borderRadius, colors, fontSize, spacing } from '@/lib/theme'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
}

const variantStyles = {
  primary: {
    background: colors.primary,
    text: colors.background,
  },
  secondary: {
    background: colors.surface,
    text: colors.text,
  },
  danger: {
    background: colors.error,
    text: colors.background,
  },
} as const

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const variantStyle = variantStyles[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variantStyle.background },
        variant === 'secondary' && styles.secondaryBorder,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text} />
      ) : (
        <Text style={[styles.text, { color: variantStyle.text }]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
