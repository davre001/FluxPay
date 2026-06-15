import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'FluxPay Docs',
    template: '%s – FluxPay Docs'
  },
  description:
    'FluxPay — a creator-brand deal escrow platform powered by AI verification and on-chain smart accounts.'
}

const navbar = (
  <Navbar
    logo={<b>FluxPay</b>}
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
