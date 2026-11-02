const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    client: {
      overlay: false, // 모든 에러 오버레이 끄기
    },
    proxy: {
      '/api': { 
        target: 'http://localhost:3000', 
        changeOrigin: true,
        timeout: 120000, // 120초 (AI 생성 시간 대기)
        proxyTimeout: 120000
      }
    }
  }
});