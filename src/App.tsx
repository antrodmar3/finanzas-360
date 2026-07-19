import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, ChevronDown, CircleUserRound, Landmark, LayoutDashboard, LogOut, Plus, Search, Settings, ShieldCheck, Sparkles, TrendingUp, WalletCards, X } from 'lucide-react'
import { seedTransactions } from './data'
import { findAssets, type AssetSuggestion } from './assetCatalog'
import { observeAuth, signInWithGoogle, signOut, type AuthUser } from './firebase'
import type { AssetType, Transaction } from './types'

type Page = 'Resumen' | 'Actualidad' | 'Mi cartera' | 'Perfil'
const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [page, setPage] = useState<Page>('Resumen')
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions)
  const [showForm, setShowForm] = useState(false)
  const [newsFilter, setNewsFilter] = useState('Todas')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    observeAuth((nextUser) => {
      setUser(nextUser)
      setAuthReady(true)
    }).then((stop) => { unsubscribe = stop }).catch((error: Error) => {
      setAuthError(error.message)
      setAuthReady(true)
    })
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    if (!user) return
    localStorage.removeItem('finanzas360-transactions')
    const stored = localStorage.getItem(`finanzas360-transactions:${user.uid}`)
    const saved: Transaction[] = stored ? JSON.parse(stored) : seedTransactions
    const legacyDemoIds = new Set(['1', '2', '3'])
    const clean = saved.filter((transaction) => !legacyDemoIds.has(transaction.id))
    setTransactions(clean)
    if (clean.length !== saved.length) {
      localStorage.setItem(`finanzas360-transactions:${user.uid}`, JSON.stringify(clean))
    }
  }, [user])

  const stats = useMemo(() => {
    const invested = transactions.reduce((sum, t) => sum + t.units * t.purchasePrice, 0)
    const current = transactions.reduce((sum, t) => sum + t.units * t.currentPrice, 0)
    return { invested, current, profit: current - invested, returnPct: invested ? ((current - invested) / invested) * 100 : 0 }
  }, [transactions])

  const addTransaction = (transaction: Transaction) => {
    const next = [...transactions, transaction]
    setTransactions(next)
    localStorage.setItem(`finanzas360-transactions:${user?.uid}`, JSON.stringify(next))
    setShowForm(false)
  }

  const handleGoogleLogin = async () => {
    setSigningIn(true)
    setAuthError('')
    try {
      await signInWithGoogle()
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setAuthError('No se ha podido iniciar sesión con Google. Inténtalo de nuevo.')
      }
    } finally {
      setSigningIn(false)
    }
  }

  if (!authReady) return <AuthLoading />
  if (!user) return <LoginScreen onLogin={handleGoogleLogin} loading={signingIn} error={authError} />

  const firstName = user.displayName.split(' ')[0]
  const initials = user.displayName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()

  return <div className="app-shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><div className="brand-mark"><TrendingUp size={23}/></div><div><strong>Finanzas</strong><span>360</span></div></div>
      <button className="close-menu" onClick={() => setMenuOpen(false)}><X/></button>
      <p className="nav-label">ESPACIO PERSONAL</p>
      <nav>
        <Nav icon={<LayoutDashboard/>} label="Resumen" active={page === 'Resumen'} onClick={() => {setPage('Resumen'); setMenuOpen(false)}} />
        <Nav icon={<BookOpen/>} label="Actualidad" active={page === 'Actualidad'} onClick={() => {setPage('Actualidad'); setMenuOpen(false)}} />
        <Nav icon={<BriefcaseBusiness/>} label="Mi cartera" active={page === 'Mi cartera'} onClick={() => {setPage('Mi cartera'); setMenuOpen(false)}} />
      </nav>
      <p className="nav-label second">CUENTA</p>
      <nav>
        <Nav icon={<CircleUserRound/>} label="Perfil" active={page === 'Perfil'} onClick={() => {setPage('Perfil'); setMenuOpen(false)}} />
        <Nav icon={<Settings/>} label="Preferencias" active={false} onClick={() => setPage('Perfil')} />
      </nav>
      <div className="disclaimer"><Landmark/><p><strong>Información, no consejo</strong><br/>Los datos mostrados tienen fines informativos.</p></div>
    </aside>
    <main>
      <header>
        <button className="menu-button mobile-wordmark" onClick={() => setPage('Resumen')}><span><TrendingUp/></span><strong>F360</strong></button>
        <div className="search"><Search size={18}/><input placeholder="Buscar activos, fondos o noticias..."/><kbd>⌘ K</kbd></div>
        <button className="icon-button"><Bell size={20}/><i/></button>
        <button className="user" onClick={() => setPage('Perfil')}>{user.photoURL ? <img className="avatar avatar-photo" src={user.photoURL} alt="" referrerPolicy="no-referrer"/> : <div className="avatar">{initials}</div>}<span>{user.displayName}</span><ChevronDown size={16}/></button>
      </header>
      <div className="page-content">
        {page === 'Resumen' && <Dashboard firstName={firstName} stats={stats} transactions={transactions} setPage={setPage} setShowForm={setShowForm}/>}
        {page === 'Actualidad' && <NewsPage filter={newsFilter} setFilter={setNewsFilter}/>} 
        {page === 'Mi cartera' && <Portfolio stats={stats} transactions={transactions} onAdd={() => setShowForm(true)}/>} 
        {page === 'Perfil' && <Profile user={user} initials={initials} onSignOut={signOut}/>}
      </div>
    </main>
    <MobileNav page={page} setPage={setPage} onAdd={() => setShowForm(true)}/>
    {showForm && <TransactionForm onClose={() => setShowForm(false)} onAdd={addTransaction}/>} 
  </div>
}

function MobileNav({page,setPage,onAdd}:{page:Page,setPage:(page:Page)=>void,onAdd:()=>void}) {
  return <nav className="mobile-dock" aria-label="Navegación principal">
    <button className={page==='Resumen'?'active':''} onClick={()=>setPage('Resumen')}><LayoutDashboard/><span>Inicio</span></button>
    <button className={page==='Actualidad'?'active':''} onClick={()=>setPage('Actualidad')}><BookOpen/><span>Actualidad</span></button>
    <button className="dock-add" onClick={onAdd} aria-label="Añadir operación"><Plus/></button>
    <button className={page==='Mi cartera'?'active':''} onClick={()=>setPage('Mi cartera')}><BriefcaseBusiness/><span>Cartera</span></button>
    <button className={page==='Perfil'?'active':''} onClick={()=>setPage('Perfil')}><CircleUserRound/><span>Perfil</span></button>
  </nav>
}

function AuthLoading() {
  return <div className="auth-screen auth-loading"><div className="auth-logo"><TrendingUp/></div><strong>Finanzas 360</strong><div className="auth-spinner"/></div>
}

function LoginScreen({onLogin,loading,error}:{onLogin:()=>void,loading:boolean,error:string}) {
  return <main className="auth-screen">
    <div className="auth-background"><i/><i/><i/></div>
    <section className="login-card">
      <div className="login-brand"><div className="auth-logo"><TrendingUp/></div><div><strong>Finanzas</strong><span>360</span></div></div>
      <div className="login-copy"><p className="eyebrow">TU PATRIMONIO, MÁS CLARO</p><h1>Todo lo que necesitas para seguir tus inversiones.</h1><p>Noticias, fondos, ETF y acciones reunidos en un único lugar.</p></div>
      <div className="login-preview" aria-hidden="true"><div><span>Valor de la cartera</span><strong>Tu patrimonio</strong><small>Siempre actualizado</small></div><TrendingUp/></div>
      <button className="google-button" onClick={onLogin} disabled={loading}>
        {loading ? <span className="button-spinner"/> : <GoogleMark/>}
        {loading ? 'Conectando con Google…' : 'Continuar con Google'}
      </button>
      {error && <p className="auth-error">{error}</p>}
      <div className="login-security"><ShieldCheck/><span>Acceso seguro mediante Google. No compartimos tus datos.</span></div>
      <p className="login-terms">Al continuar aceptas usar Finanzas 360 como herramienta informativa, no como asesoramiento financiero.</p>
    </section>
  </main>
}

function GoogleMark() { return <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.54l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5L18.7 4.6A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z"/></svg> }

function Nav({icon,label,active,onClick}:{icon:React.ReactNode,label:string,active:boolean,onClick:()=>void}) {
  return <button className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}>{icon}<span>{label}</span></button>
}

function Dashboard({firstName,stats,transactions,setPage,setShowForm}:{firstName:string,stats:{invested:number,current:number,profit:number,returnPct:number},transactions:Transaction[],setPage:(p:Page)=>void,setShowForm:(v:boolean)=>void}) {
  const date = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const hasPositions = transactions.length > 0
  return <>
    <div className="welcome modern-welcome"><div><p className="eyebrow">{date}</p><h1>Hola, {firstName}</h1><p>{hasPositions ? 'Tu patrimonio, de un vistazo.' : 'Vamos a construir tu cartera.'}</p></div><span className="live-chip"><i/>Privado</span></div>
    <section className="wealth-hero">
      <div className="wealth-orbit"><i/><i/><TrendingUp/></div>
      <div className="wealth-content"><span>Patrimonio total</span><strong>{money.format(stats.current)}</strong><div className={stats.profit < 0 ? 'wealth-change negative' : 'wealth-change'}>{hasPositions ? <><ArrowUpRight/>{stats.returnPct.toFixed(2)}% · {money.format(stats.profit)}</> : 'Aún no hay inversiones'}</div></div>
      <button className="hero-add" onClick={() => setShowForm(true)}><Plus/>Añadir inversión</button>
    </section>
    <section className="insight-grid">
      <article className="insight-card"><div className="insight-icon"><WalletCards/></div><span>Capital aportado</span><strong>{money.format(stats.invested)}</strong><small>{transactions.length} {transactions.length === 1 ? 'posición' : 'posiciones'}</small></article>
      <article className="insight-card accent"><div className="insight-icon"><Sparkles/></div><span>Resultado</span><strong className={stats.profit < 0 ? 'negative' : ''}>{money.format(stats.profit)}</strong><small>Rentabilidad acumulada</small></article>
    </section>
    {hasPositions ? <section className="home-grid">
      <div className="card premium-card"><CardTitle title="Tus posiciones" action="Ver todas" onClick={() => setPage('Mi cartera')}/><Holdings transactions={transactions.slice(0,3)}/></div>
      <div className="card premium-card allocation"><CardTitle title="Distribución"/><Donut transactions={transactions}/></div>
    </section> : <EmptyPortfolio onAdd={() => setShowForm(true)}/>}
    <section className="source-card" onClick={() => setPage('Actualidad')}><div className="source-glow"/><div className="source-icon"><BookOpen/></div><div><span>INTELIGENCIA DE MERCADO</span><strong>Actualidad sin ruido</strong><p>Próximamente conectaremos fuentes financieras reales y verificadas.</p></div><ArrowUpRight/></section>
  </>
}

function EmptyPortfolio({onAdd}:{onAdd:()=>void}) { return <section className="empty-portfolio"><div className="empty-visual"><span/><span/><span/><TrendingUp/></div><div><p className="eyebrow">TU PRIMER PASO</p><h2>Tu cartera empieza aquí.</h2><p>Añade una compra de un fondo, ETF o acción. Solo mostraremos datos que tú hayas registrado.</p><button className="primary" onClick={onAdd}><Plus/>Añadir mi primera inversión</button></div></section> }

function Metric({label,value,detail,positive}:{label:string,value:string,detail:string,positive?:boolean}) { return <div className="metric card"><span>{label}</span><strong>{value}</strong><small className={positive?'positive':''}>{positive && '↗ '}{detail}</small></div> }
function CardTitle({title,action,onClick}:{title:string,action?:string,onClick?:()=>void}) { return <div className="card-title"><h2>{title}</h2>{action && <button onClick={onClick}>{action} →</button>}</div> }

function Donut({transactions}:{transactions:Transaction[]}) { const sums=transactions.reduce((a,t)=>({...a,[t.type]:(a[t.type]||0)+t.units*t.currentPrice}),{} as Record<string,number>); const total=Object.values(sums).reduce((a,b)=>a+b,0); const colors:Record<string,string>={Fondo:'#1f8c78',ETF:'#e1a44a','Acción':'#6b7f9c'}; let offset=0; return <div className="donut-wrap"><svg viewBox="0 0 42 42" className="donut"><circle cx="21" cy="21" r="15.9" fill="none" stroke="#e8eeeb" strokeWidth="6"/>{Object.entries(sums).map(([type,v])=>{const pct=v/total*100;const el=<circle key={type} cx="21" cy="21" r="15.9" fill="none" stroke={colors[type]} strokeWidth="6" strokeDasharray={`${pct} ${100-pct}`} strokeDashoffset={-offset} />;offset+=pct;return el})}</svg><div className="donut-label"><strong>{money.format(total)}</strong><span>Total</span></div><div className="legend">{Object.entries(sums).map(([type,v])=><div key={type}><i style={{background:colors[type]}}/><span>{type}</span><strong>{(v/total*100).toFixed(0)}%</strong></div>)}</div></div> }

function Holdings({transactions}:{transactions:Transaction[]}) { return <div className="holdings">{transactions.map(t=>{const ret=(t.currentPrice/t.purchasePrice-1)*100;return <div className="holding" key={t.id}><div className={`asset-icon ${t.type.toLowerCase()}`}>{t.type[0]}</div><div className="asset-name"><strong>{t.assetName}</strong><span>{t.type} · {t.symbol}</span></div><div className="asset-value"><strong>{money.format(t.units*t.currentPrice)}</strong><span className={ret < 0 ? 'negative' : 'positive'}>{ret >= 0 ? '+' : ''}{ret.toFixed(2)}%</span></div></div>})}</div> }

function NewsPage({filter,setFilter}:{filter:string,setFilter:(x:string)=>void}) { const cats=['Todas','Mercados','Tecnología','Energía','Fondos','Economía']; return <><div className="page-heading news-heading"><div><p className="eyebrow">SEÑAL, NO RUIDO</p><h1>Actualidad</h1><p>Información financiera procedente únicamente de fuentes reales.</p></div><span className="coming-chip">Próximamente</span></div><div className="filters">{cats.map(c=><button key={c} className={filter===c?'selected':''} onClick={()=>setFilter(c)}>{c}</button>)}</div><section className="news-empty"><div className="radar"><i/><i/><i/><BookOpen/></div><span>FUENTES EN PREPARACIÓN</span><h2>Aquí no inventamos titulares.</h2><p>La actualidad aparecerá cuando conectemos proveedores financieros reales. Hasta entonces, esta sección permanecerá limpia.</p><div className="source-pills"><span>Mercados</span><span>Fondos</span><span>Economía</span></div></section></> }

function Portfolio({stats,transactions,onAdd}:{stats:{invested:number,current:number,profit:number,returnPct:number},transactions:Transaction[],onAdd:()=>void}) { const hasPositions=transactions.length>0; return <><div className="page-heading portfolio-heading"><div><p className="eyebrow">TU PATRIMONIO</p><h1>Mi cartera</h1><p>{hasPositions?'Tus inversiones, sin letra pequeña.':'Añade tus inversiones para empezar.'}</p></div><button className="primary" onClick={onAdd}><Plus/>Añadir operación</button></div>{hasPositions ? <><section className="metric-grid three"><Metric label="Valor actual" value={money.format(stats.current)} detail={`${stats.returnPct.toFixed(2)}% total`} positive={stats.profit>=0}/><Metric label="Invertido" value={money.format(stats.invested)} detail={`${transactions.length} posiciones`}/><Metric label="Resultado" value={money.format(stats.profit)} detail="Ganancia no realizada" positive={stats.profit>=0}/></section><div className="card portfolio-table"><div className="table-toolbar"><h2>Posiciones</h2><div className="table-search"><Search/><input placeholder="Buscar posición"/></div></div><div className="table-scroll"><table><thead><tr><th>Producto</th><th>Tipo</th><th>Compra</th><th>Valor actual</th><th>Rentabilidad</th></tr></thead><tbody>{transactions.map(t=>{const invested=t.units*t.purchasePrice,current=t.units*t.currentPrice,ret=(current/invested-1)*100;return <tr key={t.id}><td><strong>{t.assetName}</strong><small>{t.symbol}{t.isin?` · ${t.isin}`:''}</small></td><td><span className="type-pill">{t.type}</span></td><td><strong>{money.format(invested)}</strong><small>{t.units} participaciones · {new Date(t.purchaseDate).toLocaleDateString('es-ES')}</small></td><td><strong>{money.format(current)}</strong><small>{money.format(t.currentPrice)} / ud.</small></td><td><strong className={ret<0?'negative':'positive'}>{money.format(current-invested)}</strong><small className={ret<0?'negative':'positive'}>{ret>=0?'+':''}{ret.toFixed(2)}%</small></td></tr>})}</tbody></table></div></div></> : <section className="portfolio-zero"><div className="portfolio-zero-art"><i/><i/><WalletCards/></div><p className="eyebrow">CARTERA VACÍA</p><h2>Control total desde la primera compra.</h2><p>Registra la fecha, las participaciones y el precio. Tu información aparecerá aquí, sin ejemplos ni cifras inventadas.</p><button className="primary" onClick={onAdd}><Plus/>Añadir mi primera inversión</button></section>}</> }

function Profile({user,initials,onSignOut}:{user:AuthUser,initials:string,onSignOut:()=>Promise<void>}) { return <><div className="page-heading"><div><p className="eyebrow">TU CUENTA</p><h1>Perfil y preferencias</h1><p>Personaliza la experiencia a tu manera.</p></div></div><div className="profile-grid"><div className="card profile-card">{user.photoURL ? <img className="big-avatar avatar-photo" src={user.photoURL} alt="" referrerPolicy="no-referrer"/> : <div className="big-avatar">{initials}</div>}<div><h2>{user.displayName}</h2><p>{user.email}</p><span>España · EUR</span></div><button className="signout-button" onClick={onSignOut}><LogOut/>Cerrar sesión</button></div><div className="card settings-card"><h2>Preferencias</h2><label>Moneda principal<select defaultValue="EUR"><option>EUR — Euro</option><option>USD — Dólar</option></select></label><label>Mercado nacional<select defaultValue="España"><option>España</option><option>Estados Unidos</option></select></label><label className="toggle-row"><div><strong>Resumen semanal</strong><span>Recibe los movimientos más importantes</span></div><input type="checkbox" defaultChecked/></label><label className="toggle-row"><div><strong>Alertas de cartera</strong><span>Avisos sobre variaciones relevantes</span></div><input type="checkbox" defaultChecked/></label></div></div></> }

function TransactionForm({onClose,onAdd}:{onClose:()=>void,onAdd:(t:Transaction)=>void}) {
  const [type,setType]=useState<AssetType>('Fondo')
  const [query,setQuery]=useState('')
  const [symbol,setSymbol]=useState('')
  const [isin,setIsin]=useState('')
  const [selected,setSelected]=useState<AssetSuggestion|null>(null)
  const [searchOpen,setSearchOpen]=useState(false)
  const suggestions=useMemo(()=>findAssets(query),[query])

  const selectAsset=(asset:AssetSuggestion)=>{
    setSelected(asset)
    setQuery(asset.name)
    setSymbol(asset.symbol)
    setIsin(asset.isin)
    setType(asset.type)
    setSearchOpen(false)
  }

  const changeQuery=(value:string)=>{
    setQuery(value)
    setSelected(null)
    setSearchOpen(true)
  }

  const submit=(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const d=new FormData(e.currentTarget)
    onAdd({id:crypto.randomUUID(),assetName:query.trim(),symbol:symbol.trim(),isin:isin.trim(),type,units:Number(d.get('units')),purchasePrice:Number(d.get('price')),currentPrice:Number(d.get('currentPrice')),purchaseDate:String(d.get('date')),currency:'EUR'})
  }

  const canSuggest=query.trim().length>=3&&!selected
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form className="modal asset-modal" onSubmit={submit}>
    <div className="modal-title"><div><p className="eyebrow">NUEVA INVERSIÓN</p><h2>Añadir activo</h2><span>Busca o introduce el producto manualmente.</span></div><button type="button" onClick={onClose}><X/></button></div>
    <div className="asset-search-wrap">
      <label htmlFor="asset-search">Buscar activo</label>
      <div className={searchOpen&&canSuggest?'asset-search active':'asset-search'}><Search/><input id="asset-search" name="name" value={query} onChange={e=>changeQuery(e.target.value)} onFocus={()=>setSearchOpen(true)} autoComplete="off" required placeholder="Nombre, ticker o ISIN"/><span>{query.trim().length}/3</span></div>
      {searchOpen&&canSuggest&&<div className="asset-suggestions" role="listbox">
        <div className="suggestion-caption"><span>Coincidencias verificadas</span><small>OpenFIGI</small></div>
        {suggestions.length>0?suggestions.map(asset=><button type="button" role="option" key={asset.isin} onMouseDown={e=>e.preventDefault()} onClick={()=>selectAsset(asset)}><div className={`suggestion-icon ${asset.type.toLowerCase()}`}>{asset.type[0]}</div><div><strong>{asset.name}</strong><span>{asset.symbol} · {asset.isin}</span></div><small>{asset.type}<br/>{asset.market} · {asset.currency}</small></button>):<div className="no-suggestions"><Search/><div><strong>No está en el catálogo</strong><span>Puedes seguir y completar los datos manualmente.</span></div></div>}
      </div>}
      {!canSuggest&&!selected&&<p className="search-hint">Escribe al menos 3 caracteres para ver coincidencias.</p>}
      {selected&&<div className="selected-asset"><ShieldCheck/><div><strong>Activo identificado</strong><span>{selected.symbol} · {selected.isin} · {selected.market}</span></div><button type="button" onClick={()=>{setSelected(null);setSearchOpen(true)}}>Cambiar</button></div>}
    </div>
    <label className="product-type-label">Tipo de producto<div className="type-tabs">{(['Fondo','ETF','Acción'] as AssetType[]).map(x=><button type="button" key={x} className={type===x?'selected':''} onClick={()=>setType(x)}>{x}</button>)}</div></label>
    <div className="form-grid asset-details"><label>Símbolo<input name="symbol" value={symbol} onChange={e=>setSymbol(e.target.value)} required placeholder="Ticker o código"/></label><label>ISIN <span>(opcional)</span><input name="isin" value={isin} onChange={e=>setIsin(e.target.value)} placeholder="ES... / IE..."/></label><label>Fecha de compra<input name="date" type="date" required/></label><label>Participaciones<input name="units" type="number" step="any" min="0.000001" required inputMode="decimal"/></label><label>Precio de compra (EUR)<input name="price" type="number" step="any" min="0" required inputMode="decimal"/></label><label>Precio actual (EUR)<input name="currentPrice" type="number" step="any" min="0" required inputMode="decimal"/></label></div>
    <p className="form-note"><ShieldCheck/>Los resultados solo identifican productos; no son recomendaciones de inversión. Los precios los introduces tú.</p>
    <div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="primary" type="submit" disabled={!query.trim()||!symbol.trim()}>Guardar inversión</button></div>
  </form></div>
}

export default App
