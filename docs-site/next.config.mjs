import nextra from 'nextra'

const withNextra = nextra({
  // Nextra 4 reads theme + search config from the app layout, not a themeConfig file.
})

export default withNextra({
  reactStrictMode: true
})
