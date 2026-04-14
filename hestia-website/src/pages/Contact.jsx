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

const infoItems = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Service Area',
    value: 'Southern California',
    sub: 'Contact us to confirm your city',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: 'Phone',
    value: '(XXX) XXX-XXXX',
    sub: 'Mon–Fri, 9 am–5 pm PST',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Email',
    value: 'info@hestiahomecare.com',
    sub: 'We reply within 24 hours',
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', message: '' })
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
          <h1 className="font-serif text-6xl lg:text-7xl text-white mb-5">Contact Us</h1>
          <p className="text-lg max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Ready to get started? We'd love to talk. Our team is here to answer questions and help you find the right care.
          </p>
        </div>
      </section>

      {/* ── Form + Info ── */}
      <section className="py-24" style={{ background: C.cream }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-14">

          {/* Form */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Reach Out</p>
            <h2 className="font-serif text-3xl mb-8" style={{ color: C.text }}>Contact Hestia Home Care</h2>

            {submitted ? (
              <div
                className="p-12 rounded-2xl text-center"
                style={{ background: C.tan, border: `1px solid ${C.border}` }}
              >
                <div className="text-5xl mb-4">💌</div>
                <h3 className="font-serif text-2xl mb-2" style={{ color: C.text }}>Message Sent!</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Thank you for reaching out. A member of our team will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                <div>
                  <label style={labelStyle}>I'm Interested In</label>
                  <select
                    value={form.service}
                    onChange={e => setForm({ ...form, service: e.target.value })}
                    style={borderFor('service')}
                    onFocus={() => setFocused('service')}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="">Select a service...</option>
                    <option>Home Care for a Family Member</option>
                    <option>Workers' Compensation Care</option>
                    <option>Veterans' Care</option>
                    <option>MedLink / Medication Services</option>
                    <option>Caregiver Employment</option>
                    <option>General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    rows={5}
                    placeholder="Tell us about your situation and what kind of help you're looking for..."
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
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Info sidebar */}
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold }}>Corporate Information</p>

            {infoItems.map(item => (
              <div
                key={item.label}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ background: C.tan, border: `1px solid ${C.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${C.crimson}15`, color: C.crimson }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: C.muted }}>{item.label}</p>
                  <p className="font-semibold text-sm" style={{ color: C.text }}>{item.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{item.sub}</p>
                </div>
              </div>
            ))}

            {/* Social */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: C.tan, border: `1px solid ${C.border}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Follow Us</p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  style={{ background: C.crimson }}
                >
                  <span>📸</span> Instagram
                </a>
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  style={{ background: C.crimson }}
                >
                  <span>👥</span> Facebook
                </a>
              </div>
            </div>

            {/* CDSS badge */}
            <div
              className="p-5 rounded-2xl text-center"
              style={{ background: C.tan, border: `1px solid ${C.border}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Licensed By</p>
              <p className="font-serif font-semibold text-sm leading-relaxed" style={{ color: C.text }}>
                CDSS Home Care<br />Services Bureau
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
