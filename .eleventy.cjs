module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("docs/**/*.png");
  eleventyConfig.addPassthroughCopy("docs/css/**/*.css");

  return {
    dir: {
      input: "docs",
      output: "public/docs",
      includes: "_includes",
    },
    pathPrefix: "",
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    templateFormats: ["md", "html"],
    passthroughFileCopy: true,
    format: "html",
  };
};
