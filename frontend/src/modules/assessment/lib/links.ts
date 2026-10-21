// Il link che l'HR manda a un valutatore esterno: la pagina pubblica
// /assessment/evaluate con il token dell'assegnazione (emesso dal server).
export function buildAssignmentLink(token: string): string {
  return `${window.location.origin}/assessment/evaluate?evalToken=${token}`
}
