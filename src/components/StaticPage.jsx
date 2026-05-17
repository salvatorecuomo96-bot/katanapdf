import Footer from "./ui/Footer";
import { CINZEL, FELL, INK, LACQUER } from "./utils/constant";

const LINE = "rgba(116,86,44,0.18)";

const NAV_LINKS = [
  ["About", "/about"],
  ["FAQs", "/faqs"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

const FAQS = [
  { q: "Is katanapdf really free?", a: "Yes. Every feature is free with no paid tier, no freemium limit, and no plan to add one." },
  { q: "Are my files uploaded somewhere?", a: "No. The PDF is opened, edited and saved entirely inside your browser. We have no servers that receive your file." },
  { q: "Do I need an account?", a: "No. There is no sign-up, no email required, no tracking of who edits what." },
  { q: "Does katanapdf add a watermark?", a: "No. Downloaded PDFs contain only your original content and the edits you made." },
  { q: "Can I edit existing PDF text?", a: "Yes, if the PDF has a selectable text layer. Click any text block to edit it. For scanned PDFs, activate the built-in OCR to detect text, or add new text boxes on top." },
  { q: "Can I merge PDF files?", a: "Yes. Open your first PDF, then use the + button in the page sidebar to add more PDFs or images. Drag to reorder, then download." },
  { q: "Can I split a PDF?", a: "Yes. Use the Split PDF button in the editor toolbar to extract pages or split the document into separate files." },
  { q: "Can I sign PDFs?", a: "Yes. The Sign tool lets you draw, type or upload a signature and place it anywhere on the page." },
  { q: "Does it work on scanned PDFs?", a: "Scanned PDFs can be opened and viewed. The built-in OCR tool can detect and make text editable, though heavily degraded scans may need manual correction." },
  { q: "What file size can I edit?", a: "Any size your browser can handle — typically files up to a few hundred MB work fine on a modern computer." },
];

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p><em>Last updated: May 2026</em></p>
        <h2>How katanapdf processes your files</h2>
        <p>katanapdf processes PDF files entirely within your browser using client-side JavaScript. Your file is never uploaded to any server. Every editing operation — text changes, annotations, merging, splitting, signing — happens locally on your device.</p>
        <h2>What we collect</h2>
        <p>We do not collect, store, or transmit the contents of any PDF you open. We do not require an account, login, or personal information of any kind to use the editor.</p>
        <h2>Analytics and ads</h2>
        <p>We may serve advertisements through third-party providers such as Google AdSense. These providers may use cookies to serve ads based on prior visits to this and other websites. You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
        <h2>Fonts</h2>
        <p>katanapdf loads fonts from Google Fonts. This means your browser makes a request to Google's servers to download the typefaces used in the interface.</p>
        <h2>Cookies</h2>
        <p>We do not set our own tracking cookies. Third-party cookies may be set by ad providers. You can disable cookies in your browser without affecting the editor's functionality.</p>
        <h2>Children</h2>
        <p>This site is not directed at children under 13. We do not knowingly collect personal information from children.</p>
        <h2>Contact</h2>
        <p>Questions about this policy can be sent to <a href="mailto:katanapdf@gmail.com">katanapdf@gmail.com</a>.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of Service",
    body: (
      <>
        <p><em>Last updated: May 2026</em></p>
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
        <p>katanapdf is a free, browser-based PDF editor built on a simple principle: editing a PDF should not require uploading your file to a server, creating an account, or paying a subscription.</p>
        <h2>How it works</h2>
        <p>Everything runs in your browser. We use PDF.js for rendering, pdf-lib for saving, and Tesseract.js for optical character recognition — to open, edit and download PDFs without ever sending your file anywhere.</p>
        <h2>What you can do</h2>
        <p>Edit existing text, add new text boxes, insert images, draw and annotate freehand, add shapes, sign documents, merge multiple files, split pages, reorder and delete pages, and convert images to PDF — all free, with no watermark.</p>
        <h2>Why free?</h2>
        <p>The site is supported by unobtrusive advertising. There is no paid tier and no plan to add one.</p>
        <h2>Contact</h2>
        <p>For feedback, bug reports, or feature requests, reach us at <a href="mailto:katanapdf@gmail.com">katanapdf@gmail.com</a>.</p>
      </>
    ),
  },
};

export default function StaticPage({ route, navigate }) {
  const isFaqs = route === "faqs";
  const content = isFaqs ? { title: "Frequently Asked Questions" } : CONTENT[route];
  if (!content) return null;

  const nav = navigate || ((href) => { window.location.href = href; });

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(to bottom, rgba(255,252,246,0.90) 0%, rgba(255,252,246,0.94) 100%), url("/background.png") center top / cover no-repeat fixed`, color: INK, fontFamily: FELL }}>

      {isFaqs && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        }) }} />
      )}

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,253,248,0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${LINE}`, height: 60, display: "flex", alignItems: "center", padding: "0 36px" }}>
        <a href="/" onClick={e => { e.preventDefault(); nav("/"); }} style={{ textDecoration: "none", marginRight: "auto" }}>
          <img src="/logo.png" alt="katanapdf — Free PDF Editor" style={{ width: "min(180px,42vw)", height: "auto", display: "block" }} />
        </a>
        <nav style={{ display: "flex", alignItems: "center" }}>
          {NAV_LINKS.map(([label, href]) => (
            <a key={label} href={href}
              onClick={e => { e.preventDefault(); nav(href); }}
              style={{ fontFamily: CINZEL, fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700, color: "rgba(24,19,13,0.5)", textDecoration: "none", padding: "0 12px", borderRight: `1px solid ${LINE}` }}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "56px 28px 72px", fontSize: 16, lineHeight: 1.78, fontFamily: FELL, color: INK }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: CINZEL, fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase", color: LACQUER, fontWeight: 700, marginBottom: 18 }}>
          <span style={{ display: "inline-block", width: 24, height: 1, background: LACQUER }} />
          katanapdf
          <span style={{ display: "inline-block", width: 24, height: 1, background: LACQUER }} />
        </div>
        <h1 style={{ fontFamily: CINZEL, fontSize: 26, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginTop: 0, marginBottom: 10, color: INK }}>{content.title}</h1>
        <div style={{ height: 2.5, background: LACQUER, width: 36, borderRadius: 2, marginBottom: 32 }} />

        {isFaqs ? (
          <div className="static-body">
            {FAQS.map((f, i) => (
              <div key={i}>
                <h2>{f.q}</h2>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="static-body">{content.body}</div>
        )}

        <p style={{ marginTop: 44 }}>
          <a href="/" onClick={e => { e.preventDefault(); nav("/"); }}
            style={{ color: LACQUER, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", textDecoration: "none", fontWeight: 700, borderBottom: `1px solid rgba(139,26,26,0.35)`, paddingBottom: 2 }}>
            ← Back to editor
          </a>
        </p>
      </article>

      <Footer navigate={nav} />

      <style>{`
        .static-body h2 { font-family: ${CINZEL}; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800; color: ${LACQUER}; margin: 32px 0 10px; }
        .static-body p { margin: 0 0 16px; color: rgba(24,19,13,0.82); }
        .static-body a { color: ${LACQUER}; text-decoration: underline; }
        .static-body em { color: rgba(24,19,13,0.58); }
      `}</style>
    </div>
  );
}
