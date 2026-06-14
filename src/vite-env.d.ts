/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.css' {
  const content: string
  export default content
}

declare module '@rainbow-me/rainbowkit/styles.css' {
  const content: string
  export default content
}