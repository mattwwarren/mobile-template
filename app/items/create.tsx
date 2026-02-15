import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { z } from 'zod'

import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui'
import { useCreateItem } from '@/hooks/useItems'
import { colors, fontSize, spacing } from '@/lib/theme'

const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
})

type CreateItemFormData = z.infer<typeof createItemSchema>

export default function CreateItemScreen() {
  const router = useRouter()
  const createItem = useCreateItem()

  const { control, handleSubmit } = useForm<CreateItemFormData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const onSubmit = useCallback(
    (data: CreateItemFormData) => {
      createItem.mutate(data, {
        onSuccess: () => {
          Alert.alert('Success', 'Item created successfully.', [
            { text: 'OK', onPress: () => router.back() },
          ])
        },
        onError: (err) => {
          Alert.alert('Error', err.message)
        },
      })
    },
    [createItem, router]
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Item</Text>

        <FormField
          control={control}
          name="title"
          label="Title"
          placeholder="Enter item title"
          autoCapitalize="sentences"
        />

        <FormField
          control={control}
          name="description"
          label="Description"
          placeholder="Enter item description"
          multiline
          numberOfLines={4}
          style={styles.textArea}
          textAlignVertical="top"
        />

        {createItem.error ? <Text style={styles.errorText}>{createItem.error.message}</Text> : null}

        <Button
          title="Create Item"
          onPress={handleSubmit(onSubmit)}
          loading={createItem.isPending}
          disabled={createItem.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
})
