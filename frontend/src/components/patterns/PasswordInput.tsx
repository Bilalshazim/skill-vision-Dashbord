import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Campo password con il bottone per mostrarla o nasconderla. Dentro un Field
// riceve id e aria-* come un Input (è in LINKABLE di Field.tsx), così
// l'etichetta punta al campo e non al bottone.
export function PasswordInput({
  value,
  onChange,
  autoComplete = 'new-password',
  disabled,
  ...aria
}: {
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  disabled?: boolean
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex gap-2">
      <Input {...aria} type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="font-mono" />
      <Button type="button" variant="outline" size="icon" onClick={() => setVisible((v) => !v)} disabled={disabled} aria-label={visible ? 'Nascondi la password' : 'Mostra la password'} aria-pressed={visible}>
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}
