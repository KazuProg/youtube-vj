// rollup.config.js
export default {
  input: {
    projection: "src/projection.js",
    controller: "src/controller.js",
  },
  output: {
    dir: "dist",
    format: "es",
    entryFileNames: "[name].js", // => index.js, about.js, contact.js
  },
  plugins: [
    // 必要に応じてpluginsを追加
  ],
};
