import { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Account from "./account";
import { LancerProvider } from "@/src/providers/lancerProvider";

function App() {
  // Placed before router component to ensure window is defined
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (ready) {
    return (
      <div>
        <Router>
          <LancerProvider referrer="account">
            <Account />
          </LancerProvider>
        </Router>
      </div>
    );
  }
  return <div>hi</div>;
}

export default App;
