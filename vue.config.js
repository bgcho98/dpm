module.exports = {
  runtimeCompiler: true,
  devServer: {
    useLocalIp: true,
    disableHostCheck: true,
    port: 9999,
    proxy: {
      '^/api/dooray': {
        target: 'https://nhnent.dooray.com',
        pathRewrite: {
          '^/api/dooray': ''
        },
        changeOrigin: true,
        xfwd: false,
        onProxyReq(proxyReq, req, res) {
          proxyReq.setHeader('Host', 'nhnent.dooray.com')
          proxyReq.setHeader('referer', 'https://nhnent.dooray.com/project/1963480696738741170/2361477291042219393?order=-createdAt&workflowClass=all&page=1')
          proxyReq.setHeader('upgrade-insecure-requests', '1')
        }
      }
    }
  }
}