import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { AUTH_STATUS_UNCONFIGURED, useAuth } from '@/auth'
import { ErrorView } from '@/components/shared/ErrorView'
import { colors } from '@/lib/theme'

export default function Index() {
  const { isAuthenticated, isLoading, status, error } = useAuth()

  if (status === AUTH_STATUS_UNCONFIGURED && error) {
    return <ErrorView error={error} />
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} testID="auth-loading" />
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
