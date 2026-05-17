export const SEO_PAGES = {
  "/": {
    title: "Free PDF Editor Online — katanapdf | No Upload, No Account",
    description: "Edit, annotate, sign, merge and split PDFs free directly in your browser. No upload, no account, no watermark. Files stay on your device.",
    canonical: "https://katanapdf.com/",
    ogTitle: "Free PDF Editor Online — katanapdf",
    ogDesc: "Edit, annotate, sign, merge and split PDFs free. No upload, no account, no watermark. 100% in your browser.",
  },
  "/edit-pdf": {
    title: "Edit PDF Online Free — katanapdf",
    description: "Edit PDF text, add text boxes, images, signatures and annotations directly in your browser. No upload, no account, no watermark.",
    canonical: "https://katanapdf.com/edit-pdf",
    ogTitle: "Edit PDF Online Free — katanapdf",
    ogDesc: "Edit PDF text, add text boxes and images directly in your browser. No upload, no account, no watermark.",
  },
  "/merge-pdf": {
    title: "Merge PDF Files Free — katanapdf",
    description: "Combine multiple PDF files into one free, directly in your browser. No upload, no account and no watermark.",
    canonical: "https://katanapdf.com/merge-pdf",
    ogTitle: "Merge PDF Files Free — katanapdf",
    ogDesc: "Combine multiple PDFs into one free in your browser. No upload, no account, no watermark.",
  },
  "/split-pdf": {
    title: "Split PDF Online Free — katanapdf",
    description: "Split a PDF into separate files free in your browser. No upload, no account and no watermark.",
    canonical: "https://katanapdf.com/split-pdf",
    ogTitle: "Split PDF Online Free — katanapdf",
    ogDesc: "Split a PDF into separate files free in your browser. No upload, no account, no watermark.",
  },
  "/sign-pdf": {
    title: "Sign PDF Online Free — katanapdf",
    description: "Add a signature to your PDF free directly in your browser. Draw, type or upload a signature with no file upload.",
    canonical: "https://katanapdf.com/sign-pdf",
    ogTitle: "Sign PDF Online Free — katanapdf",
    ogDesc: "Add a signature to your PDF free in your browser. No upload, no account, no watermark.",
  },
  "/annotate-pdf": {
    title: "Annotate PDF Online Free — katanapdf",
    description: "Draw, highlight, add shapes and annotate PDFs free directly in your browser. No upload, no account and no watermark.",
    canonical: "https://katanapdf.com/annotate-pdf",
    ogTitle: "Annotate PDF Online Free — katanapdf",
    ogDesc: "Draw, highlight and annotate PDFs free in your browser. No upload, no account, no watermark.",
  },
  "/image-to-pdf": {
    title: "Image to PDF Converter Free — katanapdf",
    description: "Convert JPG and PNG images to PDF free directly in your browser. No upload, no account and no watermark.",
    canonical: "https://katanapdf.com/image-to-pdf",
    ogTitle: "Image to PDF Converter Free — katanapdf",
    ogDesc: "Convert images to PDF free in your browser. No upload, no account, no watermark.",
  },
  "/reorder-pdf": {
    title: "Reorder PDF Pages Online Free — katanapdf",
    description: "Reorder, rotate and delete PDF pages free directly in your browser. No upload, no account and no watermark.",
    canonical: "https://katanapdf.com/reorder-pdf",
    ogTitle: "Reorder PDF Pages Online Free — katanapdf",
    ogDesc: "Reorder, rotate and delete PDF pages free in your browser. No upload, no account, no watermark.",
  },
  "/faqs": {
    title: "FAQs — katanapdf Free PDF Editor",
    description: "Frequently asked questions about katanapdf, the free browser-based PDF editor with no upload, no account and no watermark.",
    canonical: "https://katanapdf.com/faqs",
    ogTitle: "FAQs — katanapdf",
    ogDesc: "Frequently asked questions about katanapdf, the free browser-based PDF editor.",
  },
  "/about": {
    title: "About — katanapdf",
    description: "Learn about katanapdf, a free browser-based PDF editor that keeps your files on your device.",
    canonical: "https://katanapdf.com/about",
    ogTitle: "About — katanapdf",
    ogDesc: "Learn about katanapdf, the free browser-based PDF editor with no upload and no account.",
  },
  "/privacy": {
    title: "Privacy Policy — katanapdf",
    description: "katanapdf privacy policy. Your PDF files stay on your device and are not uploaded to our servers.",
    canonical: "https://katanapdf.com/privacy",
    ogTitle: "Privacy Policy — katanapdf",
    ogDesc: "katanapdf privacy policy. Your files stay on your device.",
  },
  "/terms": {
    title: "Terms of Service — katanapdf",
    description: "katanapdf terms of service.",
    canonical: "https://katanapdf.com/terms",
    ogTitle: "Terms of Service — katanapdf",
    ogDesc: "katanapdf terms of service.",
  },
};

export const HASH_TO_PATH = {
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  faqs: "/faqs",
  merge: "/merge-pdf",
  split: "/split-pdf",
  sign: "/sign-pdf",
  draw: "/annotate-pdf",
  "image-to-pdf": "/image-to-pdf",
  reorder: "/reorder-pdf",
};

export const LANDING_ROUTES = [
  "/edit-pdf",
  "/merge-pdf",
  "/split-pdf",
  "/sign-pdf",
  "/annotate-pdf",
  "/image-to-pdf",
  "/reorder-pdf",
];

export const STATIC_ROUTES = {
  "/about": "about",
  "/faqs": "faqs",
  "/privacy": "privacy",
  "/terms": "terms",
};

export function updateMeta(pathname) {
  if (typeof document === "undefined") return;
  const page = SEO_PAGES[pathname] || SEO_PAGES["/"];
  document.title = page.title;
  const setMeta = (sel, attr, val) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  };
  setMeta('meta[name="description"]', "content", page.description);
  setMeta('link[rel="canonical"]', "href", page.canonical);
  setMeta('meta[property="og:title"]', "content", page.ogTitle || page.title);
  setMeta('meta[property="og:description"]', "content", page.ogDesc || page.description);
  setMeta('meta[property="og:url"]', "content", page.canonical);
  setMeta('meta[name="twitter:title"]', "content", page.ogTitle || page.title);
  setMeta('meta[name="twitter:description"]', "content", page.ogDesc || page.description);
}
