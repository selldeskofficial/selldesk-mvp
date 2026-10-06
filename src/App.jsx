import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HomeScreen from './components/HomeScreen'
import DataTable from './components/DataTable'
import ResultsDashboard from './components/ResultsDashboard'
import DemoModal from './components/DemoModal'
import { SDMark, SellDeskWordmark } from './components/Brand'
import './App.css'

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [rows, setRows] = useState([])
  const [results, setResults] = useState(null)
  const [showDemo, setShowDemo] = useState(false)
  const [csvWarning, setCsvWarning] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleDataReady(initialRows, warning = null) {
    setRows(initialRows)
    setCsvWarning(warning)
    setScreen('table')
  }

  function handleAnalysisComplete(payload) {
    setResults(payload)
    setScreen('results')
  }

  function handleReset() {
    setRows([])
    setResults(null)
    setScreen('home')
  }

  return (
    <div className="app">
      <header className={`app-header ${scrolled ? 'app-header--scrolled' : ''}`}>
        <a className="app-logo-link" href="#top" aria-label="SellDesk home" onClick={() => setMobileNavOpen(false)}>
          <SellDeskWordmark />
        </a>

        <nav className={`app-nav ${mobileNavOpen ? 'app-nav--open' : ''}`} aria-label="Primary navigation">
          <a href="#product" onClick={() => setMobileNavOpen(false)}>Product</a>
          <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>How it works</a>
          <a href="#cafes" onClick={() => setMobileNavOpen(false)}>For Cafés</a>
          <a href="#about" onClick={() => setMobileNavOpen(false)}>About</a>
        </nav>

        <div className="app-header-actions">
          <button className="btn btn--primary btn--sm" onClick={() => setShowDemo(true)}>
            Book a Demo →
          </button>
          <button
            className="nav-toggle"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(open => !open)}
          >
            <SDMark />
            <span>Menu</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div key="home" {...pageVariants}>
              <HomeScreen onDataReady={handleDataReady} />
            </motion.div>
          )}
          {screen === 'table' && (
            <motion.div key="table" {...pageVariants}>
              <DataTable
                rows={rows}
                setRows={setRows}
                onAnalysisComplete={handleAnalysisComplete}
                onBack={handleReset}
                csvWarning={csvWarning}
              />
            </motion.div>
          )}
          {screen === 'results' && (
            <motion.div key="results" {...pageVariants}>
              <ResultsDashboard
                results={results}
                onBack={() => setScreen('table')}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      <footer className="app-footer">
        <div className="footer-glow" aria-hidden="true" />
        <div className="footer-inner">
          <div className="footer-kicker">Make every menu</div>
          <h2 className="footer-statement">decision count.</h2>
          <button className="btn btn--primary footer-cta" onClick={() => setScreen('home')}>
            Try SellDesk →
          </button>

          <div className="footer-nav-row">
            <SellDeskWordmark variant="light" />
            <nav className="footer-nav" aria-label="Footer navigation">
              <a href="#product">Product</a>
              <a href="#how-it-works">How it works</a>
              <a href="#cafes">For Cafés</a>
              <a href="#about">About</a>
              <a href="#top">Privacy</a>
              <a href="#top">Terms</a>
            </nav>
          </div>

          <p className="app-footer-tagline">Revenue intelligence for independent cafés.</p>
          <div className="footer-megatype" aria-hidden="true">
            <span>Sell</span><span>desk</span>
          </div>
          <span className="app-footer-copy">© 2026 SellDesk</span>
        </div>
      </footer>
    </div>
  )
}
