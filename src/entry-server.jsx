import { renderToString } from "react-dom/server";
import App from "./App.jsx";
export { SEO_PAGES } from "./seo.js";

export function render(pathname = "/") {
  return renderToString(<App initialPath={pathname} />);
}
