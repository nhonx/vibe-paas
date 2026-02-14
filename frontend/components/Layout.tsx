import React from "react";
import Head from "next/head";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = "Vibe PaaS" }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="VPS Project Deployment System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-neo-bg font-sans">
        <nav className="bg-white border-b-4 border-black px-4 py-4 mb-8 sticky top-0 z-10 shadow-neo">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-neo-yellow border-2 border-black shadow-neo-sm flex items-center justify-center font-black text-xl select-none transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-none transition-all cursor-default">
                V
              </div>
              <h1 className="text-2xl font-black italic tracking-tighter cursor-default">
                VIBE<span className="text-neo-blue">PAAS</span>
              </h1>
            </div>
            <div className="flex gap-4 items-center">
              <a
                href="#"
                className="font-bold border-2 border-transparent hover:border-black px-3 py-1 transition-all rounded-none hover:bg-neo-pink hover:text-white hover:shadow-neo-sm"
              >
                Docs
              </a>
              <div className="w-8 h-8 rounded-full bg-neo-green border-2 border-black hover:animate-spin cursor-pointer" />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 pb-12">{children}</main>
      </div>
    </>
  );
}
