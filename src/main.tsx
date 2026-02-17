// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { Provider } from "./Provider.tsx";
import "@/styles/globals.css";
import { EnvProvider } from "@/contexts/EnvContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <EnvProvider>
    <BrowserRouter>
      <Provider>
        <main className="dark text-foreground w-full h-full">
          <App />
        </main>
      </Provider>
    </BrowserRouter>
  </EnvProvider>
);
