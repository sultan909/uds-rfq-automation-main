import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CurrencyProvider } from "@/contexts/currency-context"
import { PrimeReactProvider } from 'primereact/api'

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "UDS - Universal Data Supplies",
  description: "RFQ Management System",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
    lang="en"
    className="light"
    style={{colorScheme: "light"}}>
      <body className={inter.className}>
        <PrimeReactProvider value={{ 
          ripple: true,
          hideOverlaysOnDocumentScrolling: false,
          autoZIndex: true,
          zIndex: {
            modal: 1100,
            overlay: 1000,
            menu: 1000,
            tooltip: 1100
          }
        }}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <CurrencyProvider>{children}</CurrencyProvider>
          </ThemeProvider>
        </PrimeReactProvider>
      </body>
    </html>
  )
}
