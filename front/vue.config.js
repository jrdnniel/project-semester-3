module.exports = {
  publicPath: '/',
  devServer: {
    port: 8080,
    proxy: 'http://localhost:5000'
  },
  lintOnSave: true,
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  productionSourceMap: false
};
