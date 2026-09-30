/* Картинки из src/saas/**: webpack Remotion отдаёт их адресом файла. */
declare module '*.png' {
  const src: string
  export default src
}
