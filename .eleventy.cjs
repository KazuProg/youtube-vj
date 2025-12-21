module.exports = function (eleventyConfig) {
  return {
    dir: {
      input: "docs",
      output: "public/docs",
    },
    pathPrefix: "",
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    templateFormats: ["md", "html"],
    passthroughFileCopy: true,
    format: "html",
  };
};