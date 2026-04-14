import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const C = {
  crimson: '#7B1D3A',
  deep: '#5E1229',
  cream: '#FAF7F4',
  text: '#2C1810',
  muted: '#8C7B74',
  border: '#EDE3DC',
}

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/careers', label: 'Careers' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: scrolled ? '0 1px 20px rgba(44,24,16,0.10)' : 'none',
        borderBottom: scrolled ? 'none' : `1px solid ${C.border}`,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <img src="/HHC.png" alt="Hestia Home Care" className="h-9 object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium transition-colors duration-200"
              style={{
                color: location.pathname === link.to ? C.crimson : C.text,
                borderBottom: location.pathname === link.to ? `2px solid ${C.crimson}` : '2px solid transparent',
                paddingBottom: '2px',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:block">
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.crimson}, ${C.deep})` }}
          >
            Book Consultation
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-0.5 transition-all duration-200 origin-center"
            style={{
              background: C.text,
              transform: menuOpen ? 'rotate(45deg) translate(3px, 7px)' : 'none',
            }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ background: C.text, opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200 origin-center"
            style={{
              background: C.text,
              transform: menuOpen ? 'rotate(-45deg) translate(3px, -7px)' : 'none',
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{ maxHeight: menuOpen ? '400px' : '0' }}
      >
        <div className="px-6 pb-5 pt-2 space-y-1" style={{ borderTop: `1px solid ${C.border}`, background: 'white' }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="block py-2.5 text-sm font-medium transition-colors"
              style={{ color: location.pathname === link.to ? C.crimson : C.text }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="block mt-3 px-5 py-3 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.crimson}, ${C.deep})` }}
          >
            Book Consultation
          </Link>
        </div>
      </div>
    </header>
  )
}
