import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: 저장소가 user.github.io 가 아니라면 base 를 '/저장소이름/' 로 둔다.
// 저장소명이 sample-list 가 아니면 이 값을 바꿀 것. (루트 배포면 '/')
export default defineConfig({
  plugins: [react()],
  base: '/sample-list/',
})
