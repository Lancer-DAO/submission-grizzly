import { defineConfig } from 'tsup'
import sass from 'sass-loader'

export default defineConfig({
  loader: {
    '.scss': 'css'
  },
})