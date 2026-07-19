import type { NewsItem, Transaction } from './types'

export const seedTransactions: Transaction[] = [
  { id: '1', assetName: 'Vanguard Global Stock Index', symbol: '0P0000WAHE', isin: 'IE00B03HCZ61', type: 'Fondo', units: 48.62, purchasePrice: 34.96, currentPrice: 41.08, purchaseDate: '2024-02-12', currency: 'EUR' },
  { id: '2', assetName: 'iShares Core MSCI World', symbol: 'IWDA', isin: 'IE00B4L5Y983', type: 'ETF', units: 15, purchasePrice: 82.40, currentPrice: 96.28, purchaseDate: '2024-05-03', currency: 'EUR' },
  { id: '3', assetName: 'Iberdrola', symbol: 'IBE.MC', isin: 'ES0144580Y14', type: 'Acción', units: 80, purchasePrice: 11.16, currentPrice: 13.72, purchaseDate: '2023-11-20', currency: 'EUR' },
]

export const news: NewsItem[] = [
  { id: 1, category: 'Tecnología', source: 'Reuters', title: 'La inversión en inteligencia artificial sostiene el gasto tecnológico', summary: 'Los grandes proveedores de infraestructura mantienen sus planes de inversión mientras el mercado vigila los márgenes.', time: 'Hace 35 min', tone: 'positive' },
  { id: 2, category: 'Energía', source: 'Expansión', title: 'Las renovables ganan peso en la generación eléctrica española', summary: 'El sector vuelve a captar la atención de los inversores europeos tras una mejora de las perspectivas regulatorias.', time: 'Hace 1 h', tone: 'positive' },
  { id: 3, category: 'Mercados', source: 'Financial Times', title: 'Las bolsas europeas abren una sesión de cautela', summary: 'Los inversores esperan nuevas referencias de inflación y resultados empresariales antes de aumentar exposición.', time: 'Hace 2 h', tone: 'neutral' },
  { id: 4, category: 'Fondos', source: 'Cinco Días', title: 'La gestión indexada amplía su oferta para el ahorrador europeo', summary: 'Las gestoras compiten con nuevas clases de bajo coste y una selección creciente de fondos globales.', time: 'Hace 3 h', tone: 'neutral' },
  { id: 5, category: 'Economía', source: 'El Economista', title: 'El euro se mueve ante las nuevas previsiones macroeconómicas', summary: 'El mercado de divisas ajusta sus expectativas de tipos para la segunda mitad del año.', time: 'Hace 4 h', tone: 'negative' },
]
