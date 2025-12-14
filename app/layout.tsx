import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import LightRays from '@/Lights/LightRays'
import NavBar from '@/components/NavBar'
const SchibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

const MartianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevEvent",
  description: "The Hub for Every Dev Event You Musn't Miss",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${SchibstedGrotesk.variable} ${MartianMono.variable} min-h-screen antialiased`}
      >
        <NavBar />
        <div className="absolute top-0 inset-0 z-[-1] min-h-screen">



  <LightRays
    raysOrigin="top-center-offset"
    raysColor="#5dfeca"
    raysSpeed={0.7}
    lightSpread={1.6}
    rayLength={5}
    followMouse={true}
    mouseInfluence={0.01}
    noiseAmount={0.01}
    distortion={0.015}
  />

        </div>
        <main>{children}</main>
        
      </body>
    </html>
  );
}
