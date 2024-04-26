const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    port: 8088,
    client: {
      overlay: false
    }
  },
  chainWebpack: (config) => {
    config.plugin('define').tap((definitions) => {
      definitions[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
      return definitions;
    });
  }
})
