"use strict";

const customCSS = `
/* Hide all elements except video elements */
#movie_player > *:not(.html5-video-container) {
  display: none !important;
}
`;
const AncestorOrigin = window.frames.location.ancestorOrigins[0] || null;

// if this window is projection window
if (
  AncestorOrigin &&
  AncestorOrigin.indexOf("kazuprog") != -1 &&
  window.outerWidth / 2 < window.innerWidth
) {
  const style = document.createElement("style");
  style.textContent = customCSS;
  document.head.appendChild(style);
}
