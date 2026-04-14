import { useState } from 'react'
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

const services = [
  { icon: '🛁', title: 'Bathing & Hygiene', desc: 'Dignified personal care with bathing, grooming, and daily hygiene routines.' },
  { icon: '🏠', title: 'Housekeeping', desc: 'Light cleaning, laundry, and tidying to keep the home safe and welcoming.' },
  { icon: '🍽️', title: 'Meal Preparation', desc: 'Nutritious meals planned and cooked around dietary needs and preferences.' },
  { icon: '🚗', title: 'Transportation', desc: 'Safe rides to appointments, errands, and social outings.' },
  { icon: '💊', title: 'Medication Reminders', desc: 'Timely reminders to support health and treatment adherence.' },
  { icon: '🤝', title: 'Companionship', desc: 'Social engagement and emotional support for a fulfilling daily life.' },
  { icon: '👔', title: 'Dressing Assistance', desc: 'Help selecting and putting on clothing with dignity and comfort.' },
  { icon: '🏃', title: 'Mobility Support', desc: 'Safe movement, transfers, and fall prevention at home.' },
]

const faqs = [
  {
    q: 'Does Medi-Cal pay for home care services?',
    a: 'Yes. Through CalAIM, many Medi-Cal managed care plans now offer in-home support as part of their "Community Supports" benefits — including housekeeping, meal prep, and respite care. For many members, these services are available at no cost. Eligibility varies by plan.',
  },
  {
    q: 'How can I tell if a loved one needs home care?',
    a: "A few common signs: they're struggling with daily tasks like bathing, cooking, or remembering medications; you notice changes in mobility, balance, or personal hygiene; they seem overwhelmed or isolated. When safety, independence, or well-being starts slipping, home care can fill the gaps without forcing major lifestyle changes.",
  },
  {
    q: 'What areas do you serve?',
    a: 'We serve clients across Southern California. Contact us to confirm coverage in your specific city or zip code.',
  },
  {
    q: 'Are your caregivers background-checked?',
    a: 'Yes. All Hestia caregivers undergo thorough background checks before placement. We are fully licensed by the California Department of Social Services (CDSS) Home Care Services Bureau.',
  },
]

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left py-5 flex items-start justify-between gap-4"
      >
        <span className="font-serif font-semibold text-lg leading-snug" style={{ color: C.text }}>{q}</span>
        <span
          className="text-xl font-light flex-shrink-0 mt-0.5 transition-transform duration-200"
          style={{ color: C.crimson, transform: open ? 'rotate(45deg)' : 'none' }}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '300px' : '0' }}
      >
        <p className="pb-5 leading-relaxed text-sm" style={{ color: C.muted }}>{a}</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex items-center pt-16 overflow-hidden"
        style={{ background: 'linear-gradient(140deg, #1a0a08 0%, #3d0e1e 45%, #7B1D3A 100%)' }}
      >
        {/* Decorative glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{
            width: 700, height: 700,
            background: 'radial-gradient(circle, rgba(184,150,90,0.15) 0%, transparent 65%)',
            top: -200, right: -100,
          }} />
          <div className="absolute rounded-full" style={{
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 65%)',
            bottom: 0, right: 350,
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left: content */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10" style={{ background: C.gold }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: C.gold }}>
                Licensed · Background-Checked · Medi-Cal Accepted
              </span>
            </div>

            <h1 className="font-serif text-5xl lg:text-6xl text-white leading-tight mb-6">
              Comfort.<br />Convenience.<br />
              <span style={{ color: C.gold }}>Connection.</span>
            </h1>

            <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Hestia Home Care provides personalized, compassionate in-home support for seniors, veterans, and individuals recovering from illness or injury across Southern California.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'white', color: C.crimson }}
              >
                Book Free Consultation
              </Link>
              <Link
                to="/services"
                className="px-7 py-3.5 rounded-xl font-semibold text-sm border-2 text-white transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
              >
                Explore Services
              </Link>
            </div>
          </div>

          {/* Right: logo ring */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div
                className="w-80 h-80 rounded-full flex items-center justify-center"
                style={{ border: '2px solid rgba(184,150,90,0.25)' }}
              >
                <div
                  className="w-64 h-64 rounded-full flex items-center justify-center p-10"
                  style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(14px)' }}
                >
                  <img src="/HestiaHomeCare.png" alt="Hestia Home Care" className="w-full object-contain brightness-0 invert opacity-90" />
                </div>
              </div>
              {/* Floating badge */}
              <div
                className="absolute -bottom-5 -right-8 bg-white rounded-2xl px-5 py-3"
                style={{ boxShadow: '0 8px 32px rgba(44,24,16,0.20)' }}
              >
                <p className="text-xs font-medium" style={{ color: C.muted }}>Serving</p>
                <p className="text-sm font-bold" style={{ color: C.text }}>Southern California</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll nudge */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0.35 }}>
          <span className="text-white text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8" style={{ background: 'white' }} />
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section style={{ background: C.tan }}>
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'CDSS Licensed',
            'Background-Checked Caregivers',
            'Medi-Cal Accepted',
            "Workers' Comp & Veterans",
          ].map(item => (
            <div key={item} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: C.crimson }}
              >
                <span className="text-white text-xs font-bold leading-none">✓</span>
              </div>
              <span className="text-sm font-medium" style={{ color: C.text }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services overview ── */}
      <section className="py-24" style={{ background: C.cream }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>What We Offer</p>
            <h2 className="font-serif text-4xl" style={{ color: C.text }}>What Personalized Care Can Look Like</h2>
            <p className="mt-4 text-base max-w-lg mx-auto leading-relaxed" style={{ color: C.muted }}>
              Every plan is built around your loved one's specific needs — from a few hours a week to full-time live-in care.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map(s => (
              <div
                key={s.title}
                className="p-6 rounded-2xl text-center transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'white',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 2px 10px rgba(44,24,16,0.05)',
                }}
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <p className="font-semibold text-sm mb-1.5" style={{ color: C.text }}>{s.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 font-semibold text-sm transition-all"
              style={{ color: C.crimson }}
            >
              View All Services <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── About / Why Hestia ── */}
      <section className="py-24" style={{ background: C.tan }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>About Us</p>
            <h2 className="font-serif text-4xl leading-tight mb-6" style={{ color: C.text }}>
              Your Home.<br />Your Routine.<br />Your Comfort.
            </h2>
            <p className="leading-relaxed mb-5" style={{ color: C.muted }}>
              At Hestia Home Care, we believe great caregiving begins with great caregivers. Our team supports older adults, injured workers, and veterans across Southern California — helping them stay safe, independent, and connected to the life they love.
            </p>
            <p className="leading-relaxed mb-8" style={{ color: C.muted }}>
              We match each client with a caregiver based on care needs, personality, language, and lifestyle. Because the right fit makes all the difference.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${C.crimson}, ${C.deep})` }}
              >
                Book Free Consultation
              </Link>
              <Link
                to="/careers"
                className="px-6 py-3 rounded-xl font-semibold text-sm border transition-colors"
                style={{ color: C.crimson, borderColor: `${C.crimson}55` }}
              >
                Join Our Team
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '5+', label: 'Years of Service' },
              { value: 'CalAIM', label: 'Medi-Cal Supported' },
              { value: 'SoCal', label: 'Southern California' },
              { value: 'CDSS', label: 'Fully Licensed' },
            ].map(stat => (
              <div
                key={stat.label}
                className="p-7 rounded-2xl"
                style={{
                  background: 'white',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 2px 10px rgba(44,24,16,0.04)',
                }}
              >
                <p className="font-serif text-3xl font-bold mb-1" style={{ color: C.crimson }}>{stat.value}</p>
                <p className="text-sm" style={{ color: C.muted }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MedLink ── */}
      <section className="py-20" style={{ background: C.cream }}>
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="rounded-3xl p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            style={{ background: `linear-gradient(135deg, ${C.deep} 0%, ${C.crimson} 100%)` }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(184,150,90,0.9)' }}>Partnership</p>
              <h2 className="font-serif text-3xl text-white mb-4">MedLink Specialty Solutions</h2>
              <p className="leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Personalized pharmacy and medication support — all from the comfort of your home. Through our partnership with Mother's Care Pharmacy, clients receive seamless medication coordination alongside their care plan.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'white', color: C.crimson }}
              >
                Learn More
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[
                'Medication Reminders',
                'Prescription Delivery',
                'Refill Management',
                'Adherence Monitoring',
                'Safety Checks',
                'Education Assistance',
                'Patient Confidentiality',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: 'rgba(184,150,90,0.9)' }}>✓</span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Medi-Cal callout ── */}
      <section className="py-20" style={{ background: C.tan }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Good to Know</p>
          <h2 className="font-serif text-3xl mb-5" style={{ color: C.text }}>Medi-Cal May Cover Your Care</h2>
          <p className="leading-relaxed mb-8" style={{ color: C.muted }}>
            Through CalAIM, many Medi-Cal managed care plans now offer in-home support as part of their "Community Supports" — including housekeeping, meal prep, and respite care. For many members, these services are available at <strong style={{ color: C.text }}>no cost</strong>.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.crimson}, ${C.deep})` }}
          >
            Check Your Eligibility
          </Link>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-24" style={{ background: C.cream }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.gold }}>FAQs</p>
            <h2 className="font-serif text-3xl" style={{ color: C.text }}>Frequently Asked Questions</h2>
          </div>
          {faqs.map(faq => <FAQ key={faq.q} {...faq} />)}
        </div>
      </section>

      {/* ── Careers teaser ── */}
      <section className="py-24" style={{ background: C.tan }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Careers</p>
            <h2 className="font-serif text-4xl leading-tight mb-5" style={{ color: C.text }}>
              We're Looking<br />for Great People.
            </h2>
            <p className="leading-relaxed mb-8" style={{ color: C.muted }}>
              If you have a heart for service and a talent for making someone's day brighter, we want to hear from you. Join a team that values its caregivers as much as its clients.
            </p>
            <Link
              to="/careers"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${C.crimson}, ${C.deep})` }}
            >
              Get Started
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { icon: '💙', title: 'Meaningful Work', desc: 'Make a real difference in someone\'s quality of life every day.' },
              { icon: '📅', title: 'Flexible Scheduling', desc: 'Hours that work around your life — part-time, full-time, or live-in.' },
              { icon: '💰', title: 'Competitive Pay', desc: 'Competitive hourly rates and mileage reimbursement.' },
              { icon: '📚', title: 'Training & Support', desc: 'We invest in your growth, skills, and certifications.' },
            ].map(b => (
              <div
                key={b.title}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: 'white', border: `1px solid ${C.border}` }}
              >
                <span className="text-xl flex-shrink-0">{b.icon}</span>
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: C.text }}>{b.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section
        className="py-24"
        style={{ background: 'linear-gradient(140deg, #1a0a08 0%, #7B1D3A 100%)' }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl text-white mb-4">Ready to Get Started?</h2>
          <p className="mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Contact us for a free consultation. We'll learn about your needs and find the right caregiver for your family.
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
