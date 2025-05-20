// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (router.pathname !== "/interviews") {
      router.replace("/interviews");
    }
  }, [router]);

  return <Component {...pageProps} />;
}
