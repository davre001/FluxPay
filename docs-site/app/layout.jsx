import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import Image from 'next/image'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'FluxPay Docs',
    template: '%s – FluxPay Docs'
  },
  description:
    'FluxPay — a creator-brand deal escrow platform powered by AI verification and on-chain smart accounts.',
  icons: { icon: '/logo.png' }
}

const logo = (
  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Image src="/logo.png" alt="FluxPay" width={28} height={28} style={{ borderRadius: 6 }} />
    <b>FluxPay</b>
  </span>
)

const navbar = (
  <Navbar
    logo={logo}
    projectLink="https://github.com/Dami904/FluxPay"
  />
)

const footer = (
  <Footer>MIT {new Date().getFullYear()} © FluxPay.</Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/Dami904/FluxPay/tree/main/docs-site/content"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
