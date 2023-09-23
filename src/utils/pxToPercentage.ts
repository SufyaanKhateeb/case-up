export default function pxToPercentage(px: number, limit = 1920) {
  if (limit < 0) return 0;
  return (px / limit) * 100;
}
