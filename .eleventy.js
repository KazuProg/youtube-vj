module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("docs-src/*.png");

  return {
    dir: {
      input: "docs-src",
      output: "docs",
    },
    pathPrefix: "",
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    templateFormats: ["md", "html"],
    passthroughFileCopy: true,
    format: "html",
  };
};
