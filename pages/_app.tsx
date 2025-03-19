import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";
import type { FC } from "react";
import React, { useMemo } from "react";
import RootLayout from "@/components/layout";
import { siteConfig } from "@/config/site";

// Use require instead of import since order matters
require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  // Set network dynamically from environment variables
const network = useMemo(() => {
  const net = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Mainnet;
  console.log("Solana Net", net);
  return net;
}, []);

  // Use a custom RPC endpoint with a proper fallback
  const endpoint = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_ALCHEMY_HTTP || clusterApiUrl(network);
    return url;
    }, [network]); // Removed dependency on process.env.NEXT_PUBLIC_ALCHEMY_HTTP
  

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [network]);

  return (
    <>
      <DefaultSeo
        title={siteConfig.name}
        openGraph={{
          type: "website",
          locale: "en_EN",
          description: siteConfig.description,
          site_name: siteConfig.name,
          title: siteConfig.name,
        }}
        description={siteConfig.description}
      />

      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <RootLayout>
              <Component {...pageProps} />
            </RootLayout>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};

export default App;
