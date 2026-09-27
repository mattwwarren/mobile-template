export const parseUseMocks = (value: string | undefined): boolean => value === 'true'

export const USE_MOCKS = parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS)
