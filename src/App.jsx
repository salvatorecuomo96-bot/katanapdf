import { useState, useEffect } from "react";
import PDFEditor from "./components/PDFEditor";
import StaticPage from "./components/StaticPage";
import LandingPage from "./components/LandingPage";
import { HASH_TO_PATH, LANDING_ROUTES, STATIC_ROUTES, updateMeta } from "./seo.js";

function normalizePath(p) {
  return p.replace(/\/+$/, "") || "/";
}

export default function App({ initialPath }) {
  const [currentPath, setCurrentPath] = useState(() =>
    normalizePath(initialPath || (typeof window !== "undefined" ? window.location.pathname : "/"))
  );
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    // Redirect old hash URLs to real paths
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (hash && HASH_TO_PATH[hash]) {
      const newPath = HASH_TO_PATH[hash];
      window.history.replaceState({}, "", newPath);
      setCurrentPath(newPath);
      return;
    }

    // Update meta on initial load
    updateMeta(normalizePath(window.location.pathname));

    const onPop = () => {
      const p = normalizePath(window.location.pathname);
      setCurrentPath(p);
      updateMeta(p);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (path) => {
    if (typeof window === "undefined") return;
    window.history.pushState({}, "", path);
    const p = normalizePath(path);
    setCurrentPath(p);
    updateMeta(p);
    window.scrollTo(0, 0);
  };

  const staticRoute = STATIC_ROUTES[currentPath];
  if (staticRoute) {
    return <StaticPage route={staticRoute} navigate={navigate} />;
  }

  if (LANDING_ROUTES.includes(currentPath)) {
    return (
      <LandingPage
        route={currentPath}
        navigate={navigate}
        setPendingFile={setPendingFile}
      />
    );
  }

  return (
    <PDFEditor
      pendingFile={pendingFile}
      onPendingFileConsumed={() => setPendingFile(null)}
      navigate={navigate}
    />
  );
}
