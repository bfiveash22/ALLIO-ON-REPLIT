import { createRoot } from "react-dom/client";
import "./lib/csrf";
import App from "./App";
import "./index.css";
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
