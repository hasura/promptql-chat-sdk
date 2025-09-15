import { BasicDemo } from "../examples/demos/basic/BasicDemo";
import { McDonaldsDemo } from "../examples/demos/mcdonalds/McDonaldsDemo";
import { ArsenalDemo } from "../examples/demos/arsenal/ArsenalDemo";
import "./App.css";

/**
 * Main App component that loads different demos based on environment variables
 * - Default: Basic demo with sane defaults
 * - VITE_DEMO=mcdonalds: McDonald's branded demo
 * - VITE_DEMO=arsenal: Arsenal demo with component library approach
 */
function App() {
  const demoType = import.meta.env.VITE_DEMO || "basic";

  switch (demoType) {
    case "mcdonalds":
      return <McDonaldsDemo />;
    case "arsenal":
      return <ArsenalDemo />;
    case "basic":
    default:
      return <BasicDemo />;
  }
}

export default App;
