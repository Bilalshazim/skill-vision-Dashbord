import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Campo password con il bottone per mostrarla o nasconderla, dentro il campo
// a destra (lo spazio a destra del testo lo lascia pr-12). Dentro un Field
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
    <div className="relative">
      <Input {...aria} type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="pr-12 font-mono" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'Nascondi la password' : 'Mostra la password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}
