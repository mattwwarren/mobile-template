export const shouldUseMocks = (value: string | undefined): boolean => value === 'true'

export const USE_MOCKS = shouldUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS)
