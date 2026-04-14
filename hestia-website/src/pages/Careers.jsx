import { useState } from 'react'

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

const whyUs = [
  { icon: '💙', title: 'Meaningful Work', desc: "Every day you make a tangible difference in someone's quality of life. That's not just a job — that's a calling." },
  { icon: '📅', title: 'Flexible Scheduling', desc: 'We work around your life. Choose hours and locations that fit your availability — part-time, full-time, or live-in.' },
  { icon: '💰', title: 'Competitive Pay', desc: 'Competitive hourly rates, mileage reimbursement, and pay that reflects the value you bring.' },
  { icon: '📚', title: 'Training & Development', desc: "Whether you're new to caregiving or a seasoned professional, we invest in your skills and certifications." },
  { icon: '🤝', title: 'Supportive Team', desc: "You're never alone. Our coordinators are available to help you navigate client needs and care challenges." },
]

const lookingFor = [
  'A genuine passion for helping others',
  'Reliability and strong communication skills',
  'Comfort working one-on-one in a home setting',
  'Valid California driver\'s license (preferred)',
  'CPR / First Aid certification (or willingness to obtain)',
  'Ability to pass a background check',
]

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: `1px solid #DDD0C8`,
  background: 'white',
  color: '#2C1810',
  fontSize: '14px',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: '6px',
  color: '#8C7B74',
}

export default function Careers() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', experience: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const borderFor = field => ({
    ...inputStyle,
    borderColor: focused === field ? C.crimson : C.border,
    boxShadow: focused === field ? `0 0 0 3px ${C.crimson}15` : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  const handleSubmit = e => {
    e.preventDefault()
    // TODO: wire to backend
    setSubmitted(true)
  }

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
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Join the Team</p>
          <h1 className="font-serif text-5xl lg:text-6xl text-white mb-5">
            We're Looking<br />for Great People.
          </h1>
          <p className="text-lg max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
            If you have a heart for service and a talent for making someone's day brighter — you'll fit right in here.
          </p>
        </div>
      </section>

      {/* ── Why + Apply ── */}
      <section className="py-24" style={{ background: C.cream }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Why work with us */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Why Work With Us</p>
            <h2 className="font-serif text-3xl mb-10" style={{ color: C.text }}>More Than a Job</h2>
            <div className="space-y-6">
              {whyUs.map(item => (
                <div key={item.title} className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: C.text }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply form */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Apply Now</p>
            <h2 className="font-serif text-3xl mb-8" style={{ color: C.text }}>Get Started</h2>

            {submitted ? (
              <div
                className="p-10 rounded-2xl text-center"
                style={{ background: C.tan, border: `1px solid ${C.border}` }}
              >
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-serif text-xl mb-2" style={{ color: C.text }}>Application Received!</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Thank you for your interest in Hestia Home Care. Our team will be in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={borderFor('name')}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      style={borderFor('phone')}
                      onFocus={() => setFocused('phone')}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      style={borderFor('email')}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Years of Experience</label>
                  <select
                    value={form.experience}
                    onChange={e => setForm({ ...form, experience: e.target.value })}
                    style={borderFor('experience')}
                    onFocus={() => setFocused('experience')}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="">Select...</option>
                    <option>No experience (willing to train)</option>
                    <option>Less than 1 year</option>
                    <option>1–3 years</option>
                    <option>3–5 years</option>
                    <option>5+ years</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tell Us About Yourself</label>
                  <textarea
                    rows={4}
                    placeholder="What draws you to caregiving? Any certifications, languages, or availability preferences..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ ...borderFor('message'), resize: 'none' }}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${C.crimson}, ${C.deep})` }}
                >
                  Submit Application
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── What we look for ── */}
      <section className="py-20" style={{ background: C.tan }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.gold }}>Ideal Candidates</p>
          <h2 className="font-serif text-3xl mb-10" style={{ color: C.text }}>What We're Looking For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {lookingFor.map(item => (
              <div
                key={item}
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl"
                style={{ background: 'white', border: `1px solid ${C.border}` }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: C.crimson }}
                >
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <span className="text-sm" style={{ color: C.text }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
