import { Link } from 'react-router-dom'

const C = {
  gold: '#B8965A',
  border: 'rgba(255,255,255,0.10)',
}

const cols = [
  {
    heading: 'Our Services',
    links: [
      { label: "Workers' Compensation", to: '/services' },
      { label: 'Senior Care', to: '/services' },
      { label: 'Veterans', to: '/services' },
      { label: 'MedLink', to: '/services' },
    ],
  },
  {
    heading: 'Careers',
    links: [
      { label: 'Apply Now', to: '/careers' },
      { label: 'Why Work With Us', to: '/careers' },
      { label: 'Benefits', to: '/careers' },
    ],
  },
  {
    heading: 'Contact Us',
    links: [
      { label: 'Customer Service', to: '/contact' },
      { label: 'Book Consultation', to: '/contact' },
      { label: 'Get Directions', to: '/contact' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: 'linear-gradient(160deg, #1a0a08 0%, #5E1229 100%)' }}>
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12" style={{ borderBottom: `1px solid ${C.border}` }}>

          {/* Brand column */}
          <div className="md:col-span-1">
            <img src="/HHC.png" alt="Hestia Home Care" className="h-10 object-contain brightness-0 invert mb-5" />
            <img src="/HestiaHomeCare.png" alt="Hestia Home Care" className="h-14 object-contain brightness-0 invert opacity-50 mb-5" />
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              When safety, independence, or well-being starts slipping, home care can fill the gaps without forcing major lifestyle changes.
            </p>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'white'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
            © {new Date().getFullYear()} Hestia Home Care. All rights reserved. Licensed by CDHS Home Care Services Bureau.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Serving Southern California
          </p>
        </div>
      </div>
    </footer>
  )
}
