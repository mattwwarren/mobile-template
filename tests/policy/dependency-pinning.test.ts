import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Dependency Pinning Policy', () => {
  const projectRoot = join(__dirname, '../..')
  const packageJsonPath = join(projectRoot, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  // Expo SDK-managed native/ABI packages: `expo install --fix` pins these
  // exactly, so this test allows an exact specifier only for them.
  // See ARCHITECTURE.md invariant on dependency pinning.
  const EXACT_PIN_ALLOWLIST = [
    'react',
    'react-dom',
    'react-native',
    'react-native-reanimated',
    'react-native-screens',
    'react-native-worklets',
  ]

  const EXACT_VERSION_PATTERN = /^\d+\.\d+\.\d+$/
  const TILDE_RANGE_PATTERN = /^~\d+\.\d+\.\d+/

  function collectSpecifiers(section: 'dependencies' | 'devDependencies'): Record<string, string> {
    return packageJson[section] ?? {}
  }

  describe.each(['dependencies', 'devDependencies'] as const)('%s', (section) => {
    const specifiers = collectSpecifiers(section)

    it(`${section} section exists and is non-empty`, () => {
      expect(Object.keys(specifiers).length).toBeGreaterThan(0)
    })

    for (const [name, specifier] of Object.entries(specifiers)) {
      if (EXACT_PIN_ALLOWLIST.includes(name)) {
        it(`${name} is exact-pinned (Expo-managed native/ABI package)`, () => {
          expect(specifier).toMatch(EXACT_VERSION_PATTERN)
        })
      } else {
        it(`${name} is pinned to a minor range (~)`, () => {
          expect(specifier).toMatch(TILDE_RANGE_PATTERN)
        })
      }
    }
  })
})
