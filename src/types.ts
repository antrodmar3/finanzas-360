export type AssetType = 'Acción' | 'ETF' | 'Fondo'

export interface Transaction {
  id: string
  assetName: string
  symbol: string
  isin?: string
  type: AssetType
  units: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
  currency: 'EUR' | 'USD'
}

export interface NewsItem {
  id: number
  category: string
  source: string
  title: string
  summary: string
  time: string
  tone: 'positive' | 'neutral' | 'negative'
}
