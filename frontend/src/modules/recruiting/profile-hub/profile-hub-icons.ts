import { Coins, CircleDollarSign, Cog, Gem, House, Lightbulb, TrendingDown, TriangleAlert } from 'lucide-react'

import { compositeIcon } from '@/components/patterns/CompositeIcon'

// Le icone dei quattro riquadri di "Profilo della ricerca", ispirate ai
// disegni del cliente (casa con l'euro, lampadina con diamante, denaro in
// calo, ingranaggio con avviso) e composte con icone Lucide. I disegni
// originali sono illustrazioni a parte: se si vogliono identici, vanno
// consegnati come SVG (DECISIONI, "Icone di Profilo della ricerca").
export const ProfiloCandidatoIcon = compositeIcon(House, CircleDollarSign)
export const CompetenzeTrasversaliIcon = compositeIcon(Lightbulb, Gem)
export const AnnuncioDiLavoroIcon = compositeIcon(Coins, TrendingDown)
export const AreaValutatoriIcon = compositeIcon(Cog, TriangleAlert)
