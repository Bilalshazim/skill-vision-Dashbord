// Ported verbatim from modules/recruiting.html dl() (line ~3266) — a plain
// client-side Blob download, no backend involved. Revoking the object URL
// after a short delay matches the legacy behavior exactly.
export function downloadFile(name: string, content: string, type: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
