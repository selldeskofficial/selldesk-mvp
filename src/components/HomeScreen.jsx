import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { parseCSV } from '../utils/csvParser'
import { SDMark, SellDeskWordmark } from './Brand'

function PremiumButton({ children, className, onClick, disabled, type = 'button' }) {
  const btnRef = useRef(null)

  function onMove(e) {
    if (disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const btn = btnRef.current
    const r = btn.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    btn.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`
  }

  function onLeave() {
    const btn = btnRef.current
    btn.style.transform = ''
  }

  return (
    <span className="premium-button-wrap" onMouseMove={onMove} onMouseLeave={onLeave}>
      <button ref={btnRef} type={type} className={className} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    </span>
  )
}

const SAMPLE_ROWS = [
  { id: crypto.randomUUID(), item: 'Cappuccino', sold: 42, price: 120, cost: 45 },
  { id: crypto.randomUUID(), item: 'Cold Brew', sold: 8, price: 150, cost: 70 },
  { id: crypto.randomUUID(), item: 'Mango Shake', sold: 3, price: 100, cost: 90 },
  { id: crypto.randomUUID(), item: 'Croissant', sold: 31, price: 80, cost: 30 },
  { id: crypto.randomUUID(), item: 'Sandwich', sold: 6, price: 160, cost: 110 },
  { id: crypto.randomUUID(), item: 'Latte', sold: 28, price: 130, cost: 50 },
  { id: crypto.randomUUID(), item: 'Chai', sold: 19, price: 60, cost: 15 },
  { id: crypto.randomUUID(), item: 'Brownie', sold: 5, price: 90, cost: 75 },
]

const CREDIBILITY = [
  {
    name: 'Google',
    detail: 'Startup ecosystem',
    logo: 'https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg',
  },
  {
    name: 'Microsoft',
    detail: 'Startup ecosystem',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
  },
  {
    name: 'Newton School',
    detail: 'Startup Foundry',
    logo: 'https://cdn.prod.website-files.com/62e8d2ea218fb7676b6892a6/662fd209223247bee8fb3149_NST_LOGO-01%201.svg',
  },
]

const PROBLEMS = [
  {
    n: '01',
    title: 'Slow movers hide in plain sight.',
    body: 'Items sell occasionally but still consume ingredients, prep time and menu space.',
  },
  {
    n: '02',
    title: 'Pricing gets decided by gut.',
    body: 'Owners often know their sales, but not the margin behind each item.',
  },
  {
    n: '03',
    title: 'Data rarely becomes action.',
    body: 'A spreadsheet tells you what happened. SellDesk tells you what to do next.',
  },
]

const STEPS = [
  {
    n: 'STEP 01',
    title: 'Upload your sales data',
    meta: 'CSV / POS export',
  },
  {
    n: 'STEP 02',
    title: 'SellDesk finds the patterns',
    meta: 'Margins · velocity · slow movers · performers',
  },
  {
    n: 'STEP 03',
    title: 'Get your action plan',
    meta: 'Price · bundle · promote · remove',
  },
]

const RECOMMENDATIONS = [
  {
    type: 'PRICE',
    item: 'Cappuccino',
    value: '₹120 → ₹130',
    detail: '+₹420 estimated weekly margin',
  },
  {
    type: 'BUNDLE',
    item: 'Cold Brew + Croissant',
    value: '₹220',
    detail: 'Increase attachment opportunity',
  },
  {
    type: 'REMOVE',
    item: 'Mango Shake',
    value: '3 orders / week · 10% margin',
    detail: 'Consider removing',
  },
  {
    type: 'PROMOTE',
    item: 'Masala Latte',
    value: 'High margin · High repeat rate',
    detail: 'Feature more prominently',
  },
]

const PEOPLE = [
  { cafe: 'Juice Factory', owner: 'Shubham Jain', logo: '/client-logos/juice-factory-logo.png' },
  { cafe: 'Kulcha Factory', owner: 'Saksham Jain', logo: '/client-logos/kulcha-factory-logo.png' },
  { cafe: 'Madhuram Cafe', owner: 'Ayush Sahu', logo: '/client-logos/madhuram-logo.png' },
  { cafe: 'Olives Cafe', owner: 'BP Petrol Pump', logo: '/client-logos/olives-logo.png' },
]

const TIMELINE = [
  {
    date: 'Dec 2025',
    title: 'The idea',
    body: 'What if cafe data could tell owners what to do next?',
  },
  {
    date: 'Jan 2026',
    title: 'SellDesk begins',
    body: 'Research, cafe conversations and validation turned the thought into a real problem.',
  },
  {
    date: 'Early 2026',
    title: 'Newton School Startup Foundry',
    body: 'Selected by the Foundry, then pushed harder on prototypes and real-world learning.',
  },
  {
    date: '2026',
    title: 'Into the field',
    body: 'Menus, pricing, Pune cafe data and owner conversations shaped the product.',
  },
  {
    date: 'Today',
    title: 'Building SellDesk',
    body: 'Data to intelligence to action, so every menu decision can count.',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 22, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export default function HomeScreen({ onDataReady }) {
  const fileRef = useRef(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)

  function handleManual() {
    onDataReady(SAMPLE_ROWS.map(r => ({ ...r, id: crypto.randomUUID() })))
  }

  function openUploader() {
    if (!parsing) fileRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      setParseError(null)
      setParsing(true)
      try {
        const result = await parseCSV(evt.target.result)
        if (result.rejected) {
          setParseError(result.rejectedReason || 'This dataset does not appear to be business-related. SellDesk works with product, sales, and pricing data.')
          return
        }
        if (result.rows.length === 0) {
          setParseError('Could not extract data from this CSV. Make sure it contains columns for item names and values.')
          return
        }
        onDataReady(result.rows, result.warning)
      } catch (err) {
        setParseError('Failed to parse CSV: ' + err.message)
      } finally {
        setParsing(false)
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="landing" id="top">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="visually-hidden"
        onChange={handleFileChange}
      />

      <motion.section className="landing-hero" variants={stagger} initial="initial" animate="animate">
        <motion.p className="landing-eyebrow" variants={fadeUp} transition={{ duration: 0.45 }}>
          Built for independent cafés
        </motion.p>
        <motion.h1 className="landing-title" variants={fadeUp} transition={{ duration: 0.55 }}>
          Find your slow movers.<br />
          Fix your <em>menu.</em>
        </motion.h1>
        <motion.p className="landing-subtitle" variants={fadeUp} transition={{ duration: 0.5 }}>
          Turn your sales data into pricing, combo and menu decisions — in under 3 minutes.
        </motion.p>
        <motion.div className="landing-hero-cta" variants={fadeUp} transition={{ duration: 0.45 }}>
          <PremiumButton className="btn btn--primary btn--lg" onClick={handleManual}>
            Try with sample data →
          </PremiumButton>
          <button className="btn btn--ghost btn--lg" onClick={openUploader}>
            {parsing ? 'Reading CSV…' : 'Upload CSV'}
          </button>
        </motion.div>
        <motion.p className="landing-hero-note" variants={fadeUp} transition={{ duration: 0.45 }}>
          {parseError ? <span className="error-text">{parseError}</span> : 'No signup · No setup · No spreadsheet gymnastics'}
        </motion.p>

        <motion.div className="hero-credibility" variants={fadeUp} transition={{ duration: 0.45 }}>
          <p className="section-kicker">Supported through</p>
          <div className="credibility-grid">
            {CREDIBILITY.map(item => (
              <div className="credibility-item" key={item.name}>
                <img src={item.logo} alt={`${item.name} logo`} loading="eager" />
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <motion.section className="landing-section" id="cafes" initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.22 }} variants={stagger}>
        <motion.p className="section-kicker" variants={fadeUp}>The problem</motion.p>
        <motion.h2 className="landing-section-title" variants={fadeUp}>Running on instinct is costing you money.</motion.h2>
        <motion.p className="landing-section-sub" variants={fadeUp}>
          Café owners are operators, not analysts. Without clear data, every menu decision becomes a guess.
        </motion.p>

        <div className="premium-card-grid">
          {PROBLEMS.map(problem => (
            <motion.article className="premium-card" key={problem.n} variants={fadeUp} transition={{ duration: 0.4 }}>
              <span className="card-index">{problem.n}</span>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="workflow-section" id="how-it-works" initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.22 }} variants={stagger}>
        <motion.p className="section-kicker" variants={fadeUp}>How it works</motion.p>
        <motion.h2 className="landing-section-title" variants={fadeUp}>From raw data to a clear action plan.</motion.h2>
        <div className="workflow-track">
          {STEPS.map((step, index) => (
            <motion.article className="workflow-step" key={step.n} variants={fadeUp} transition={{ duration: 0.42 }}>
              <div className="workflow-node">{index + 1}</div>
              <span>{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.meta}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="intelligence-section" id="product" initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.18 }} variants={stagger}>
        <div className="section-copy">
          <motion.p className="section-kicker" variants={fadeUp}>Sample product output</motion.p>
          <motion.h2 className="landing-section-title" variants={fadeUp}>SellDesk turns sales data into decisions.</motion.h2>
          <motion.p className="landing-section-sub" variants={fadeUp}>
            Example insights shown with demo data. Replace them with your own CSV or start with the sample menu.
          </motion.p>
        </div>
        <div className="recommendation-grid">
          {RECOMMENDATIONS.map(item => (
            <motion.article className="insight-card" key={`${item.type}-${item.item}`} variants={fadeUp} transition={{ duration: 0.4 }}>
              <span className="insight-type">{item.type}</span>
              <h3>{item.item}</h3>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="whatsapp-section" initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.16 }} variants={stagger}>
        <div className="wa-showcase-copy">
          <motion.p className="section-kicker" variants={fadeUp}>Weekly intelligence</motion.p>
          <motion.h2 className="landing-section-title" variants={fadeUp}>Your numbers don't need another dashboard.</motion.h2>
          <motion.p className="landing-section-sub" variants={fadeUp}>
            Your weekly menu intelligence. Delivered where you already work.
          </motion.p>
          <motion.div className="wa-proof-list" variants={stagger}>
            <motion.div variants={fadeUp}><span>01</span>Spot what's hurting margins</motion.div>
            <motion.div variants={fadeUp}><span>02</span>Understand why</motion.div>
            <motion.div variants={fadeUp}><span>03</span>Know exactly what to change</motion.div>
          </motion.div>
        </div>

        <motion.div className="wa-mockup" variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="wa-device-label">Product mockup</div>
          <div className="wa-header">
            <div className="wa-header-avatar"><SDMark variant="light" /></div>
            <div>
              <div className="wa-header-name">SellDesk</div>
              <div className="wa-header-sub">Business account · weekly scan ready</div>
            </div>
          </div>
          <div className="wa-body">
            <div className="wa-bubble wa-bubble--in">What's pulling my margins down this week?</div>
            <div className="wa-bubble wa-bubble--out">
              <b>SellDesk Weekly — 3 actions</b>
              <br /><br />
              1. <b>Raise Cappuccino → ₹130</b><br />
              42/wk at 62% margin<br /><br />
              2. <b>Bundle Cold Brew + Croissant</b><br />
              Cold Brew sells 8/wk — pairing lifts both items<br /><br />
              3. <b>Remove Mango Shake</b><br />
              3/wk, 10% margin — prep time better elsewhere
            </div>
            <div className="wa-time">Today, 9:14 AM · delivered</div>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        className="people-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <motion.div className="section-copy" variants={fadeUp}>
          <p className="section-kicker">People building with SellDesk</p>
          <h2 className="landing-section-title">Built with operators. Guided by experienced builders.</h2>
        </motion.div>
        <div
          className="people-carousel"
        >
          <div className="people-track">
            {PEOPLE.map(person => (
              <article className="person-card" key={person.cafe}>
                <span>Client</span>
                <div className="person-logo-wrap">
                  <img src={person.logo} alt={`${person.cafe} logo`} loading="lazy" />
                </div>
                <h3>{person.cafe}</h3>
                <p>Owner: {person.owner}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="about-section" id="about" initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.18 }} variants={stagger}>
        <div className="about-lede">
          <motion.p className="section-kicker" variants={fadeUp}>About SellDesk</motion.p>
          <motion.h2 className="about-title" variants={fadeUp}>We didn't start with a product. We started with a question.</motion.h2>
          <motion.p className="about-question" variants={fadeUp}>
            What if cafe owners didn't have to guess what to change on their menu?
          </motion.p>
        </div>

        <div className="about-grid">
          <motion.div className="about-story" variants={fadeUp}>
            <p>
              In December 2025, our founder Anuj had a simple idea: cafes create data every day, but most of it never becomes a decision. Owners know what sells, what slows down and what gets wasted, but they rarely have the time to sit with spreadsheets and turn that into action.
            </p>
            <p>
              In January 2026, SellDesk became a problem worth solving. We began speaking with cafes, studying menus, collecting real-world data in Pune and learning what actually happens behind the counter.
            </p>
            <p>
              The goal was never another dashboard full of charts. SellDesk is being built to answer the questions owners ask every week: what to reprice, what to bundle, what to remove and where the margin is quietly leaking.
            </p>
            <p>
              We are still early, still testing assumptions and still learning from cafe owners. The original question has not changed: can we make better data-driven decisions accessible to the people running cafes every day?
            </p>
          </motion.div>

          <motion.div className="about-timeline" variants={stagger}>
            {TIMELINE.map(item => (
              <motion.article className="timeline-item" key={item.date} variants={fadeUp}>
                <span>{item.date}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="landing-final-cta" initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
        <motion.div variants={fadeUp}>
          <SellDeskWordmark className="cta-wordmark" />
        </motion.div>
        <motion.h2 className="landing-cta-title" variants={fadeUp}>Know your numbers in 3 minutes.</motion.h2>
        <motion.p className="landing-cta-sub" variants={fadeUp}>
          Start with our sample café data or upload your own. No signup. No setup.
        </motion.p>
        <motion.div className="landing-hero-cta" variants={fadeUp}>
          <PremiumButton className="btn btn--primary btn--lg" onClick={handleManual}>
            Analyse sample menu →
          </PremiumButton>
          <button className="btn btn--ghost btn--lg" onClick={openUploader}>
            Upload my CSV
          </button>
        </motion.div>
        <motion.div className="landing-csv-hint" variants={fadeUp}>
          <span>CSV format</span>
          <code>item,sold,price,cost</code>
        </motion.div>
      </motion.section>
    </div>
  )
}
