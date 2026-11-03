// User-approved smoothed high-quality character; originals remain preserved.
export const characterManifest = {
  version: 7,
  status: "sufyaan-approved-connected-arms",
  model: "/character/arms-continuous.glb",
  source: "/msk_cartoon.png",
  look: {
    hair: "quiff" as const,
    beard: true,
    colors: { skin: "#eda36b", hair: "#39251b", beard: "#473024", sweater: "#f4e7d3", ink: "#0b0b0c", paper: "#fbfbf8" },
  },
  poster: "/character/smoothed-poster.png",
};
