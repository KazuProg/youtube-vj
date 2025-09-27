const waitForElementRendered = async (id: string) => {
  return new Promise<void>((resolve) => {
    const renderFrame = () => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      requestAnimationFrame(renderFrame);
    };
    renderFrame();
  });
};

export default waitForElementRendered;
