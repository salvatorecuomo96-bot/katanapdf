import { renderToString } from "react-dom/server";
import Homepage from "./components/Homepage";

export function render() {
  return renderToString(
    <Homepage
      onFile={() => {}}
      onDropFile={() => {}}
      onCreateBlank={() => {}}
    />
  );
}
