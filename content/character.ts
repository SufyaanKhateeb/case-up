// The reference is a procedural model, not a GLB. Its look is configurable here.
export const characterManifest = {
  version: 2,
  status: "reference-procedural-character",
  source: "https://www.sebg.ch/",
  look: {
    hair: "curly" as const,
    beard: true,
    colors: { skin: "#fbf3ec", hair: "#77573d", beard: "#c49c74", sweater: "#a4ad9b", ink: "#0b0b0c", paper: "#fbfbf8" },
  },
  poster: "/character/poster.png",
};
