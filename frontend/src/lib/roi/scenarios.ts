import type { RoiState } from './model.ts'

// Gli scenari del motore ROI (repository Skill-Vision-ROI, core/scenarios.js):
// cambiano solo le ipotesi di effetto, mai le basi di bilancio.
export const SCEN = [
  { id: 'prud', nome: 'Prudenziale', el: 40, r1: 50, r2: 15, r3: 10, r4: 10 },
  { id: 'base', nome: 'Base', el: 50, r1: 70, r2: 20, r3: 15, r4: 20 },
  { id: 'espa', nome: 'Espansivo', el: 60, r1: 80, r2: 25, r3: 20, r4: 30 },
] as const

export type ScenarioId = (typeof SCEN)[number]['id']

export function scenOverrides(x: (typeof SCEN)[number]): Partial<RoiState> {
  return { el: x.el, r1: x.r1, r2: x.r2, r3: x.r3, r4: x.r4 }
}
