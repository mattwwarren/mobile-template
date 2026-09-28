import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('enable_eas template toggle policy', () => {
  const projectRoot = join(__dirname, '../..')
  const copierText = readFileSync(join(projectRoot, 'copier.yaml'), 'utf-8')
  const workflowText = readFileSync(
    join(projectRoot, '.github/workflows/validate-template.yml'),
    'utf-8'
  )

  describe('copier.yaml enable_eas toggle', () => {
    it('declares enable_eas as a bool variable defaulting to true', () => {
      expect(copierText).toMatch(/enable_eas:\s*\n\s*type:\s*bool\s*\n[\s\S]*?default:\s*true/)
    })

    it('conditionally excludes eas.json when enable_eas is false', () => {
      expect(copierText).toMatch(
        /_exclude:[\s\S]*?"\{% if not enable_eas %\}eas\.json\{% endif %\}"/
      )
    })
  })

  describe('validate-template.yml eas-disabled matrix leg', () => {
    it('has a matrix leg with --data enable_eas=false', () => {
      expect(workflowText).toMatch(/--data enable_eas=false/)
    })

    it('has a step that asserts eas.json is absent when disabled', () => {
      expect(workflowText).toMatch(
        /if:\s*matrix\.config\.eas_enabled == 'false'\s*\n\s*run:\s*\|[\s\S]*?eas\.json should not exist/
      )
    })
  })
})
