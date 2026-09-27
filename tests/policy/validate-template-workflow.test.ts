import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('validate-template.yml workflow policy', () => {
  const projectRoot = join(__dirname, '../..')
  const workflowPath = join(projectRoot, '.github/workflows/validate-template.yml')
  const workflowText = readFileSync(workflowPath, 'utf-8')

  describe('Scheduled drift check', () => {
    it('has a schedule: trigger block', () => {
      expect(workflowText).toMatch(/schedule:/)
    })

    it('the schedule: block has a cron: entry', () => {
      const scheduleMatch = workflowText.match(/schedule:\s*\n((?:\s+.*\n)+)/)
      expect(scheduleMatch).not.toBeNull()
      expect(scheduleMatch?.[1]).toMatch(/cron:\s*['"].+['"]/)
    })
  })

  describe('Expo dependency drift gate', () => {
    it('runs `expo install --check` in at least one step', () => {
      expect(workflowText).toMatch(/run:\s*.*expo install --check/)
    })
  })
})
