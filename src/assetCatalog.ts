import type { AssetType } from './types'

export interface AssetSuggestion {
  name: string
  symbol: string
  isin?: string
  type: AssetType
  currency: string
  market: string
  source?: 'OpenFIGI' | 'Twelve Data'
}

// Identificadores contrastados con OpenFIGI. El catálogo sirve para rellenar
// operaciones, no constituye una recomendación de inversión ni aporta precios.
const assets: AssetSuggestion[] = [
  { name: 'Vanguard Global Stock Index Fund EUR Acc', symbol: 'VANGLVI', isin: 'IE00B03HCZ61', type: 'Fondo', currency: 'EUR', market: 'Irlanda', source: 'OpenFIGI' },
  { name: 'Fidelity MSCI World Index Fund P-Acc-EUR', symbol: 'FIWIPAE', isin: 'IE00BYX5NX33', type: 'Fondo', currency: 'EUR', market: 'Irlanda' },
  { name: 'Amundi Index MSCI World AE-C', symbol: 'AMIEAEC', isin: 'LU0996182563', type: 'Fondo', currency: 'EUR', market: 'Luxemburgo' },
  { name: 'Fundsmith Equity Fund T EUR Acc', symbol: 'FSEQFTA', isin: 'LU0690375182', type: 'Fondo', currency: 'EUR', market: 'Luxemburgo' },
  { name: 'Baelo Patrimonio FI', symbol: 'ESFBAPA', isin: 'ES0110407097', type: 'Fondo', currency: 'EUR', market: 'España' },
  { name: 'Magallanes European Equity M FI', symbol: 'MAGEUEM', isin: 'ES0159259011', type: 'Fondo', currency: 'EUR', market: 'España' },
  { name: 'iShares Core MSCI World UCITS ETF', symbol: 'IWDA', isin: 'IE00B4L5Y983', type: 'ETF', currency: 'EUR', market: 'Europa' },
  { name: 'Vanguard FTSE All-World UCITS ETF', symbol: 'VWCE', isin: 'IE00BK5BQT80', type: 'ETF', currency: 'EUR', market: 'Europa' },
  { name: 'iShares Core S&P 500 UCITS ETF', symbol: 'CSPX', isin: 'IE00B5BMR087', type: 'ETF', currency: 'EUR', market: 'Europa' },
  { name: 'iShares Core MSCI Emerging Markets IMI UCITS ETF', symbol: 'EIMI', isin: 'IE00BKM4GZ66', type: 'ETF', currency: 'EUR', market: 'Europa' },
  { name: 'Apple Inc.', symbol: 'AAPL', isin: 'US0378331005', type: 'Acción', currency: 'USD', market: 'NASDAQ' },
  { name: 'Microsoft Corporation', symbol: 'MSFT', isin: 'US5949181045', type: 'Acción', currency: 'USD', market: 'NASDAQ' },
  { name: 'NVIDIA Corporation', symbol: 'NVDA', isin: 'US67066G1040', type: 'Acción', currency: 'USD', market: 'NASDAQ' },
  { name: 'Amazon.com Inc.', symbol: 'AMZN', isin: 'US0231351067', type: 'Acción', currency: 'USD', market: 'NASDAQ' },
  { name: 'Alphabet Inc. Class A', symbol: 'GOOGL', isin: 'US02079K3059', type: 'Acción', currency: 'USD', market: 'NASDAQ' },
  { name: 'Meta Platforms Inc. Class A', symbol: 'META', isin: 'US30303M1027', type: 'Acción', currency: 'USD', market: 'NASDAQ' },
  { name: 'Tesla Inc.', symbol: 'TSLA', isin: 'US88160R1014', type: 'Acción', currency: 'USD', market: 'NASDAQ' },
  { name: 'Iberdrola S.A.', symbol: 'IBE', isin: 'ES0144580Y14', type: 'Acción', currency: 'EUR', market: 'BME' },
  { name: 'Industria de Diseño Textil S.A.', symbol: 'ITX', isin: 'ES0148396007', type: 'Acción', currency: 'EUR', market: 'BME' },
  { name: 'Banco Santander S.A.', symbol: 'SAN', isin: 'ES0113900J37', type: 'Acción', currency: 'EUR', market: 'BME' },
  { name: 'BBVA S.A.', symbol: 'BBVA', isin: 'ES0113211835', type: 'Acción', currency: 'EUR', market: 'BME' },
  { name: 'Repsol S.A.', symbol: 'REP', isin: 'ES0173516115', type: 'Acción', currency: 'EUR', market: 'BME' },
  { name: 'Aena S.M.E. S.A.', symbol: 'AENA', isin: 'ES0105046009', type: 'Acción', currency: 'EUR', market: 'BME' },
  { name: 'Ferrovial SE', symbol: 'FER', isin: 'NL0015001FS8', type: 'Acción', currency: 'EUR', market: 'BME' },
]

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function findAssets(query: string, limit = 6) {
  const term = normalize(query.trim())
  if (term.length < 3) return []

  return assets
    .map((asset) => {
      const name = normalize(asset.name)
      const symbol = normalize(asset.symbol)
      const isin = normalize(asset.isin || '')
      const score = symbol === term ? 0 : symbol.startsWith(term) ? 1 : name.startsWith(term) ? 2 : isin.startsWith(term) ? 3 : name.includes(term) ? 4 : symbol.includes(term) ? 5 : 99
      return { asset, score }
    })
    .filter(({ score }) => score < 99)
    .sort((a, b) => a.score - b.score || a.asset.name.localeCompare(b.asset.name, 'es'))
    .slice(0, limit)
    .map(({ asset }) => asset)
}

interface TwelveDataMatch {
  symbol?: string
  instrument_name?: string
  exchange?: string
  mic_code?: string
  instrument_type?: string
  country?: string
  currency?: string
}

interface TwelveDataResponse {
  data?: TwelveDataMatch[]
  status?: string
  message?: string
}

const searchCache = new Map<string, AssetSuggestion[]>()

function mapType(instrumentType: string): AssetType | null {
  if (instrumentType === 'ETF' || instrumentType === 'Exchange-Traded Note') return 'ETF'
  if (instrumentType.includes('Fund')) return 'Fondo'
  if (['Common Stock', 'Preferred Stock', 'American Depositary Receipt', 'Depositary Receipt', 'REIT', 'Trust'].includes(instrumentType)) return 'Acción'
  return null
}

function scoreAsset(asset: AssetSuggestion, term: string) {
  const name = normalize(asset.name)
  const symbol = normalize(asset.symbol)
  return symbol === term ? 0 : symbol.startsWith(term) ? 1 : name.startsWith(term) ? 2 : name.includes(term) ? 3 : 9
}

export async function searchGlobalAssets(query: string, signal?: AbortSignal) {
  const term = normalize(query.trim())
  if (term.length < 3) return []
  const cached = searchCache.get(term)
  if (cached) return cached

  const local = findAssets(query, 12)
  const url = new URL('https://api.twelvedata.com/symbol_search')
  url.searchParams.set('symbol', query.trim())
  url.searchParams.set('outputsize', '120')
  url.searchParams.set('apikey', 'demo')

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('El buscador mundial no está disponible en este momento.')
  const payload = await response.json() as TwelveDataResponse
  if (payload.status === 'error') throw new Error(payload.message || 'No se pudo completar la búsqueda mundial.')

  const remote = (payload.data || []).flatMap((item): AssetSuggestion[] => {
    const type = mapType(item.instrument_type || '')
    if (!type || !item.symbol || !item.instrument_name) return []
    return [{
      name: item.instrument_name,
      symbol: item.symbol,
      type,
      currency: item.currency || '—',
      market: item.exchange || item.mic_code || item.country || 'Mercado global',
      source: 'Twelve Data',
    }]
  })

  const seen = new Set<string>()
  const combined = [...local, ...remote]
    .sort((a, b) => scoreAsset(a, term) - scoreAsset(b, term) || a.name.localeCompare(b.name, 'es'))
    .filter((asset) => {
      const key = `${normalize(asset.symbol)}|${normalize(asset.market)}|${normalize(asset.name)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 16)

  searchCache.set(term, combined)
  return combined
}
