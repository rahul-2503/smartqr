import { Link } from 'react-router-dom';
import { HiOutlineQrCode } from 'react-icons/hi2';
import { useLanguage } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ background: '#f8f9fa', borderTop: '1px solid #f1f3f5' }}>
      <div className="container-main" style={{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)' }}>
        <div className="grid-footer">
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2d6a4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiOutlineQrCode style={{ width: 18, height: 18, color: 'white' }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Smart<span style={{ color: '#2d6a4f' }}>QR</span></span>
            </Link>
            <p style={{ fontSize: 14, color: '#a0aec0', lineHeight: 1.6 }}>{t('footer.tagline')}</p>
          </div>

          {[
            { title: t('footer.colProduct'), links: [{ l: t('footer.linkScanner'), t: '/scan' }, { l: t('footer.linkManufacturerPortal'), t: '/manufacturer' }, { l: t('footer.linkForManufacturers'), t: '/about' }, { l: t('footer.linkForConsumers'), t: '/about' }] },
            { title: t('footer.colCompany'), links: [{ l: t('footer.linkAbout'), t: '/about' }, { l: t('footer.linkMission'), t: '/about' }] },
            { title: t('footer.colConnect'), links: [{ l: 'GitHub', t: '#' }, { l: 'LinkedIn', t: '#' }, { l: 'Contact', t: '#' }] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map(link => (
                  <li key={link.l}>
                    <Link to={link.t} style={{ fontSize: 14, color: '#a0aec0', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#2d6a4f'} onMouseLeave={e => e.target.style.color = '#a0aec0'}>
                      {link.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom" style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, color: '#a0aec0' }}>© {new Date().getFullYear()} {t('footer.copyright')}</p>
          <p style={{ fontSize: 12, color: '#a0aec0' }}>{t('footer.madeIn')}</p>
        </div>
      </div>
    </footer>
  );
}
