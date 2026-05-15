import Footer from "./ui/Footer";
import { CINZEL, FELL, GOLD, INK, LACQUER } from "./utils/constant";

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
    faqs: {
      title: "Frequently Asked Questions",
      body: (
        <>
          <h2>Is katanapdf really free?</h2>
          <p>Yes. Every feature is free with no paid tier, no freemium limit, and no plan to add one.</p>
          <h2>Are my files uploaded somewhere?</h2>
          <p>No. The PDF is opened, edited and saved entirely inside your browser. We have no servers that receive your file.</p>
          <h2>Do I need an account?</h2>
          <p>No. There is no sign-up, no email required, no tracking of who edits what.</p>
          <h2>What size of PDF can I edit?</h2>
          <p>Any size your browser can handle — typically files up to a few hundred MB work fine on a modern computer.</p>
          <h2>Can I edit existing text in a PDF?</h2>
          <p>Yes, if the PDF has a selectable text layer. Click any text block to edit it. Scanned PDFs won't have editable text, but you can still add new text and images on top.</p>
          <h2>Will the layout of my PDF break?</h2>
          <p>katanapdf preserves the original page as a high-resolution image and overlays your edits on top, so the visual layout stays intact.</p>
        </>
      ),
    },
  }[route];

  if (!content) return null;

  const LINE = "rgba(116,86,44,0.18)";

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(to bottom, rgba(255,252,246,0.90) 0%, rgba(255,252,246,0.94) 100%), url("/background.png") center top / cover no-repeat fixed`,
      color: INK,
      fontFamily: FELL,
    }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,253,248,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${LINE}`,
        height: 68,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 32px",
      }}>
        <a href="#home" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="katanapdf" style={{ width: "min(200px,52vw)", height: "auto", display: "block" }} />
        </a>
      </header>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "56px 28px 72px", fontSize: 16, lineHeight: 1.78, fontFamily: FELL, color: INK }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: CINZEL, fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase",
          color: LACQUER, fontWeight: 700, marginBottom: 18,
        }}>
          <span style={{ display: "inline-block", width: 24, height: 1, background: LACQUER }} />
          katanapdf
          <span style={{ display: "inline-block", width: 24, height: 1, background: LACQUER }} />
        </div>
        <h1 style={{ fontFamily: CINZEL, fontSize: 28, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginTop: 0, marginBottom: 10, color: INK }}>{content.title}</h1>
        <div style={{ height: 2.5, background: LACQUER, width: 36, borderRadius: 2, marginBottom: 32 }} />
        <div className="static-body">{content.body}</div>
        <p style={{ marginTop: 44 }}>
          <a href="#home" style={{ color: LACQUER, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", textDecoration: "none", fontWeight: 700, borderBottom: `1px solid rgba(139,26,26,0.35)`, paddingBottom: 2 }}>
            ← Back to editor
          </a>
        </p>
      </article>
      <Footer />
      <style>{`
        .static-body h2 { font-family: ${CINZEL}; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800; color: ${LACQUER}; margin: 32px 0 10px; }
        .static-body p { margin: 0 0 16px; color: rgba(24,19,13,0.82); }
        .static-body a { color: ${LACQUER}; text-decoration: underline; }
        .static-body em { color: rgba(24,19,13,0.58); }
      `}</style>
    </div>
  );
}

