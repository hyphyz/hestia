import { Link } from 'react-router-dom'

const C = {
  crimson: '#7B1D3A',
  deep: '#5E1229',
  cream: '#FAF7F4',
  tan: '#EDE3DC',
  text: '#2C1810',
  muted: '#8C7B74',
  gold: '#B8965A',
  border: '#DDD0C8',
}

const allServices = [
  { icon: '🛁', title: 'Bathing & Hygiene', desc: 'Full assistance or supervision with bathing, showering, oral care, and grooming — performed with dignity and respect.' },
  { icon: '🏠', title: 'Housekeeping', desc: 'Light cleaning, laundry, vacuuming, dishes, and general tidying to keep the home safe and welcoming.' },
  { icon: '👔', title: 'Dressing Assistance', desc: 'Help choosing appropriate clothing and assistance with dressing and undressing comfortably.' },
  { icon: '🍽️', title: 'Meal Preparation', desc: 'Planning and cooking nutritious meals accounting for dietary restrictions and personal preferences.' },
  { icon: '🚗', title: 'Transportation', desc: "Safe rides to doctor's appointments, pharmacy runs, grocery shopping, and social outings." },
  { icon: '💇', title: 'Grooming', desc: 'Hair care, shaving, nail care, and other personal grooming to support well-being and self-confidence.' },
  { icon: '🤝', title: 'Personal Assistance', desc: 'Hands-on help with any activities of daily living tailored to individual needs.' },
  { icon: '💊', title: 'Medication Reminders', desc: 'Gentle reminders to take medications on schedule, supporting prescribed treatment plans.' },
  { icon: '💬', title: 'Companionship', desc: 'Conversation, games, outings, and emotional support to combat isolation and promote mental wellness.' },
  { icon: '🏃', title: 'Mobility & Transfers', desc: 'Assistance moving from bed to chair, walking, and transfers using safe positioning techniques.' },
  { icon: '🧠', title: 'Memory Care Support', desc: 'Patient, specialized care for individuals living with Alzheimer\'s, dementia, or other memory conditions.' },
  { icon: '🌙', title: 'Live-In & Overnight Care', desc: 'Around-the-clock support for clients who need continuous supervision or assistance through the night.' },
]

const clientTypes = [
  {
    icon: '⚕️',
    title: "Workers' Compensation",
    desc: 'We work directly with insurance carriers to coordinate care for injured workers recovering at home. We handle the administrative coordination so clients can focus on recovery.',
  },
  {
    icon: '🏠',
    title: 'Senior Care',
    desc: 'Compassionate support for older adults who wish to age in place safely. From a few hours of help per week to full live-in care, we adapt to every stage of need.',
  },
  {
    icon: '🎖️',
    title: 'Veterans',
    desc: "We're proud to serve those who served our country. Hestia works with VA programs and benefits to provide veterans the in-home care they've earned.",
  },
  {
    icon: '💊',
    title: 'MedLink Clients',
    desc: 'Through our pharmacy partnership, MedLink clients receive coordinated medication management alongside home care services — all from one trusted team.',
  },
]

const benefits = [
  { title: 'Remain Independent', desc: 'Stay in the home you love, on your own terms.' },
  { title: 'Personalized Matching', desc: 'Caregivers matched by skill, language, and personality.' },
  { title: 'No Major Life Changes', desc: 'Care fills the gaps without upending daily routines.' },
  { title: 'Family Peace of Mind', desc: "Loved ones rest easy knowing care is in good hands." },
  { title: 'Licensed & Insured', desc: 'All services fully licensed by CDSS.' },
  { title: 'Flexible Plans', desc: 'Hourly, daily, or live-in — whatever fits your life.' },
]

export default function Services() {
  return (
    <div className="pt-16">

      {/* ── Hero ── */}
      <section
        className="py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(140deg, #1a0a08 0%, #7B1D3A 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full" style={{
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(184,150,90,0.10) 0%, transparent 65%)',
            top: -100, right: -100,
          }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>What We Do</p>
          <h1 className="font-serif text-5xl lg:text-6xl text-white mb-5">Our Services</h1>
          <p className="text-lg max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Comprehensive, non-medical home care tailored to each client's unique needs, schedule, and goals.
          </p>
        </div>
      </section>

      {/* ── Who We Serve ── */}
      <section className="py-24" style={{ background: C.cream }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Our Clients</p>
            <h2 className="font-serif text-4xl" style={{ color: C.text }}>Who We Serve</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {clientTypes.map(c => (
              <div
                key={c.title}
                className="p-7 rounded-2xl"
                style={{
                  background: 'white',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 2px 10px rgba(44,24,16,0.05)',
                }}
              >
                <div className="text-3xl mb-4">{c.icon}</div>
                <h3 className="font-serif font-semibold text-lg mb-2" style={{ color: C.text }}>{c.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full services grid ── */}
      <section className="py-24" style={{ background: C.tan }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Full List</p>
            <h2 className="font-serif text-4xl" style={{ color: C.text }}>Services We Provide</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allServices.map(s => (
              <div
                key={s.title}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: 'white', border: `1px solid ${C.border}` }}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
                <div>
                  <p className="font-semibold text-sm mb-1.5" style={{ color: C.text }}>{s.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits of home care ── */}
      <section className="py-24" style={{ background: C.cream }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Why Home Care</p>
            <h2 className="font-serif text-4xl" style={{ color: C.text }}>The Benefits of Home Care</h2>
            <p className="mt-4 text-base max-w-lg mx-auto leading-relaxed" style={{ color: C.muted }}>
              A team in your corner means staying where you belong — at home.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map(b => (
              <div
                key={b.title}
                className="flex items-start gap-3 p-5 rounded-2xl"
                style={{ background: 'white', border: `1px solid ${C.border}` }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: C.crimson }}
                >
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: C.text }}>{b.title}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tagline + CTA ── */}
      <section
        className="py-24"
        style={{ background: 'linear-gradient(140deg, #1a0a08 0%, #7B1D3A 100%)' }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="font-serif text-2xl italic mb-3" style={{ color: 'rgba(255,255,255,0.50)' }}>
            "Your Home. Your Routine. Your Comfort."
          </p>
          <p className="mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Ready to explore care options? Our team will walk you through everything at no charge.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'white', color: C.crimson }}
          >
            Book Free Consultation
          </Link>
        </div>
      </section>

    </div>
  )
}
