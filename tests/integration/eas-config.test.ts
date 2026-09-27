import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import updatesPackage from '../../scripts/eas-updates-package'

const EXPECTED_PROFILES = ['development', 'preview', 'production']

describe('EAS / OTA update configuration', () => {
  const projectRoot = join(__dirname, '../..')
  const easJsonPath = join(projectRoot, 'eas.json')
  const appJson = JSON.parse(readFileSync(join(projectRoot, 'app.json'), 'utf-8'))
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'))
  describe('eas.json', () => {
    it('exists at the project root', () => {
      expect(existsSync(easJsonPath)).toBe(true)
    })

    it('is valid JSON', () => {
      expect(() => JSON.parse(readFileSync(easJsonPath, 'utf-8'))).not.toThrow()
    })

    it('defines exactly the development, preview, and production build profiles', () => {
      const easConfig = JSON.parse(readFileSync(easJsonPath, 'utf-8'))
      expect(Object.keys(easConfig.build).sort()).toEqual(EXPECTED_PROFILES)
    })

    it('gives each build profile a distinct update channel', () => {
      const easConfig = JSON.parse(readFileSync(easJsonPath, 'utf-8'))
      const channels = EXPECTED_PROFILES.map((profile) => easConfig.build[profile].channel)
      for (const channel of channels) {
        expect(typeof channel).toBe('string')
      }
      expect(new Set(channels).size).toBe(EXPECTED_PROFILES.length)
    })

    it('maps each profile 1:1 to a channel of the same name', () => {
      const easConfig = JSON.parse(readFileSync(easJsonPath, 'utf-8'))
      for (const profile of EXPECTED_PROFILES) {
        expect(easConfig.build[profile].channel).toBe(profile)
      }
    })
  })

  describe('app.json expo-updates wiring', () => {
    it('registers the expo-updates config plugin', () => {
      expect(updatesPackage).toBe('expo-updates')
      expect(appJson.expo.plugins).toContain(updatesPackage)
    })

    it('uses the fingerprint runtime version policy', () => {
      expect(appJson.expo.runtimeVersion).toEqual({ policy: 'fingerprint' })
    })
  })

  describe('package.json expo-updates dependency', () => {
    it('declares expo-updates as a runtime dependency', () => {
      expect(packageJson.dependencies).toHaveProperty('expo-updates')
    })

    it('keeps the source plugin and dependency on the same package', () => {
      expect(appJson.expo.plugins).toContain(updatesPackage)
      expect(packageJson.dependencies[updatesPackage]).toEqual(expect.any(String))
    })
  })
})
