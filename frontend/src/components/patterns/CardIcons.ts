import { CircleDollarSign, Coins, Cog, Gem, House, Lightbulb, TrendingDown, TriangleAlert } from 'lucide-react'

import { compositeIcon } from '@/components/patterns/CompositeIcon'

// Le quattro icone delle card della Home, dai disegni del cliente (casa con
// l'euro, lampadina con diamante, denaro in calo, ingranaggio con avviso),
// composte con icone Lucide: le stesse in Assessment (Home) e in Recruiting
// ("Profilo della ricerca"). Non sono gli originali: se si vogliono
// identici vanno consegnati come SVG (DECISIONI, "Icone di Profilo della
// ricerca").
export const HouseValueIcon = compositeIcon(House, CircleDollarSign)
export const LightbulbGemIcon = compositeIcon(Lightbulb, Gem)
export const CoinsLossIcon = compositeIcon(Coins, TrendingDown)
export const GearAlertIcon = compositeIcon(Cog, TriangleAlert)
