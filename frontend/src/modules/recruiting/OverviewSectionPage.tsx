import { PageHeader } from '@/components/patterns/PageHeader'
import { QualityBucketsCard, SelectionFunnelCard } from '@/modules/recruiting/components/HomeSectionCards'
import { useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// Due riquadri di "Stato dell'arte" con una pagina loro nell'indice a
// quattro livelli (documento del cliente, 2026-10-23): l'imbuto di selezione
// (livelli 2 e 3) e i candidati per fascia di idoneità (livello 3).
export default function OverviewSectionPage({ view }: { view: 'imbuto' | 'fasce' }) {
  const data = useRecruitingHomeData()

  return (
    <div className="flex flex-col gap-4">
      {view === 'imbuto' ? (
        <>
          <PageHeader level="page" className="mb-0" title="Imbuto di selezione" description="Dal CV caricato alla selezione finale: quanti candidati superano ogni fase." />
          <div className="max-w-3xl">
            <SelectionFunnelCard data={data} />
          </div>
        </>
      ) : (
        <>
          <PageHeader level="page" className="mb-0" title="Candidati per fascia di idoneità" description="I candidati in classifica per la posizione attiva, divisi per fascia." />
          <div className="max-w-3xl">
            <QualityBucketsCard data={data} />
          </div>
        </>
      )}
    </div>
  )
}
