module.exports = {
  runtimeCompiler: true,
  devServer: {
    port: 9999,
    useLocalIp: true,
    disableHostCheck: true,
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
          proxyReq.setHeader('referer', 'https://nhnent.dooray.com/project/1963480696738741170/2449958367881680487?order=-createdAt&workflowClass=all&page=1')
        }
      }
    }
  }
}