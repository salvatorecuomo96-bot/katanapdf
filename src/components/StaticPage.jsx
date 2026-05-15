import Footer from "./ui/Footer";
import { C, CINZEL, FELL, LACQUER } from "./utils/constant";

export default function StaticPage({ route }) {
  const content = {
    privacy: {
      title: "Privacy Policy",
      body: (
        <>
          <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
          <h2>What we collect</h2>
          <p>katanapdf does not collect, store, or transmit the contents of any PDF you open. Every editing operation runs locally in your browser using JavaScript. Your file never leaves your computer.</p>
          <h2>Analytics and ads</h2>
          <p>We may serve advertisements through third-party providers (such as Google AdSense). These providers may use cookies to serve ads based on prior visits to this and other websites. You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
          <h2>Cookies</h2>
          <p>We do not set our own tracking cookies. Third-party cookies may be set by ad providers. You can disable cookies in your browser at any time without affecting the editor's functionality.</p>
          <h2>Children</h2>
          <p>This site is not directed at children under 13. We do not knowingly collect personal information from children.</p>
          <h2>Contact</h2>
          <p>Questions about this policy can be sent to the contact email listed on the About page.</p>
        </>
      ),
    },
    terms: {
      title: "Terms of Use",
      body: (
        <>
          <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
          <h2>Acceptable use</h2>
          <p>You may use katanapdf to edit any PDF you have the legal right to modify. You agree not to use this service to violate copyright, infringe intellectual property, or perform unlawful acts.</p>
          <h2>No warranty</h2>
          <p>katanapdf is provided "as is", without warranty of any kind. We do not guarantee that every PDF will render or save perfectly. Always keep an original copy of your file.</p>
          <h2>Limitation of liability</h2>
          <p>To the maximum extent permitted by law, katanapdf and its operators are not liable for any data loss, damages, or losses resulting from use of this service.</p>
          <h2>Changes</h2>
          <p>These terms may be updated occasionally. Continued use of the site constitutes acceptance of the latest version.</p>
        </>
      ),
    },
    about: {
      title: "About katanapdf",
      body: (
        <>
          <p>katanapdf is a free, browser-based PDF editor. It was built on the simple idea that editing a PDF shouldn't require uploading your file to a stranger's server, signing up for an account, or paying a subscription.</p>
          <h2>How it works</h2>
          <p>Everything happens in your browser. We use modern web technologies (PDF.js for rendering, pdf-lib for saving) to open, edit, and download PDFs without ever sending the file anywhere.</p>
          <h2>Why free?</h2>
          <p>The site is supported by ads and reader donations. There is no paid tier and no plan to add one - the goal is to keep a useful tool genuinely free for everyone.</p>
          <h2>Contact</h2>
          <p>For feedback, bug reports, or feature requests you can reach us at <a href="mailto:katanapdf@gmail.com">katanapdf@gmail.com</a>.</p>
        </>
      ),
    },
  }[route];

  if (!content) return null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FELL }}>
      <header style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ height: 1, background: LACQUER, maxWidth: 920, margin: "0 auto 14px", opacity: 0.5 }} />
        <a href="#home" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: CINZEL, fontSize: 18, color: LACQUER, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600 }}>
            katanapdf
          </span>
        </a>
        <div style={{ height: 1, background: LACQUER, maxWidth: 920, margin: "14px auto 0", opacity: 0.5 }} />
      </header>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 64px", fontSize: 16, lineHeight: 1.75, fontFamily: FELL, color: C.text }}>
        <h1 style={{ fontFamily: CINZEL, fontSize: 30, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", marginTop: 0, marginBottom: 8, color: C.text }}>{content.title}</h1>
        <div style={{ height: 1, background: LACQUER, opacity: 0.3, width: 80, marginBottom: 28 }} />
        <div className="static-body">{content.body}</div>
        <p style={{ marginTop: 40 }}>
          <a href="#home" style={{ color: LACQUER, fontFamily: CINZEL, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", textDecoration: "underline", fontWeight: 600 }}>
            &lt;- Back to editor
          </a>
        </p>
      </article>
      <Footer />
      <style>{`
        .static-body h2 { font-family: ${CINZEL}; font-size: 16px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; color: ${LACQUER}; margin: 28px 0 10px; }
        .static-body p { margin: 0 0 14px; }
        .static-body a { color: ${LACQUER}; text-decoration: underline; }
        .static-body em { color: rgba(26,18,8,0.6); }
      `}</style>
    </div>
  );
}

