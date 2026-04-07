import './globals.css'
import Header from '@/app/components/Header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <html lang="pt-BR" className="h-full">
      <body className="bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1a0f1f] text-white min-h-screen">
        <Header />
        <main className="p-8">{children}</main>
      </body>
    </html>
  )
}
