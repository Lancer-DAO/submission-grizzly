import type { AppProps } from "next/app";
import "@/src/styles/app.scss";
import "@/src/styles/Form.scss";
import "@/src/styles/Bounty.scss";
import "@/src/styles/webflow.scss";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
