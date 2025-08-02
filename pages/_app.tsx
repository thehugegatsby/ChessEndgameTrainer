import "../styles/globals.css";
import type { AppProps } from "next/app";

/**
 *
 * @param root0
 * @param root0.Component
 * @param root0.pageProps
 */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
