import { Check, Copy, ExternalLink, Mail } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { publicJobPostingUrl } from '@/modules/recruiting/lib/jd'

// Il link pubblico dell'annuncio, generato quando la scheda professionale è
// confermata: si apre, si copia o si manda per email. Lo stesso nella scheda
// professionale e nella card "Annuncio di lavoro" del Profilo della ricerca.
export function JobPostingLink({ publicationLink, positionTitle }: { publicationLink: string; positionTitle: string }) {
  const url = publicJobPostingUrl(publicationLink)
  const [copied, setCopied] = useState(false)
  const mailto = `mailto:?subject=${encodeURIComponent(`Annuncio — ${positionTitle}`)}&body=${encodeURIComponent(`Ecco l'annuncio per la posizione «${positionTitle}»:\n\n${url}\n`)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="label-mono text-muted-foreground">Link dell’annuncio</span>
      <a href={url} target="_blank" rel="noopener noreferrer" className="truncate rounded-sm bg-secondary px-2 py-1 font-mono text-app-caption text-foreground underline-offset-2 hover:underline">
        {url}
      </a>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copiato' : 'Copia link'}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={mailto}>
            <Mail aria-hidden="true" />
            Invia per email
          </a>
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" />
            Apri
          </a>
        </Button>
      </div>
    </div>
  )
}
