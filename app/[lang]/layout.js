// app/[lang]/layout.js

import "./globals.css";

import Footer from "./components/layout/footer";
import Topbar from "./components/navigation/topbar";
import siteConfig from "@/config/site";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import NotFound from "./not-found";

const SUPPORTED = ["en", "ar", "es"];

// ✅ Metadata
export const metadata = {
  title: siteConfig.homeTitle,
  description: siteConfig.description,

  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL,
    languages: {
      'en': process.env.NEXT_PUBLIC_BASE_URL,
      'ar': process.env.NEXT_PUBLIC_BASE_URL,
      'es': process.env.NEXT_PUBLIC_BASE_URL,
    },
  },
  openGraph: {
    images: siteConfig.ogImage,
    locale: 'en',
    type: 'website',
  },

};
export default async function LangLayout({ children, params }) {
  // Next.js 15+: `params` is a promise and *must* be awaited :contentReference[oaicite:0]{index=0}
  const { lang } = await params;

  if (!SUPPORTED.includes(lang)) {
    NotFound(); // throws into your global 404
  }

  // Only a <div> wrapper here—no <html>, <head>, or <body>
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"}>
      <Topbar locale={lang} />
      {children}
      <Footer locale={lang} />
    </div>
  );
}