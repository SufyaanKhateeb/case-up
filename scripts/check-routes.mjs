// Run against the local production server: npm run test:routes
import assert from "node:assert/strict";
const base = process.env.PORTFOLIO_TEST_URL ?? "http://127.0.0.1:3000";
for (const [route, status, expected] of [
  ["/", 200, "Sufyaan Khateeb"],
  ["/projects/placement-app", 200, "Placement App"],
  ["/projects/real-time-chat", 200, "Real-Time Chat App"],
  ["/projects/portfolio", 200, "Personal Portfolio"],
  ["/resume", 200, "September 2026"],
  ["/resume/data", 200, "Data engineering"],
  ["/404", 404, "Back home"],
  ["/this-route-does-not-exist", 404, "Back home"],
  ["/projects/does-not-exist", 404, "Back home"],
]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, status, route);
  assert.ok((await response.text()).includes(expected), `${route} should render its content without JavaScript`);
  console.log(`${response.status} ${route}`);
}
for (const [route, type] of [
  ["/resume-fs-1.pdf", "application/pdf"],
  ["/resume/Sufyaan_resume_fullstack.pdf", "application/pdf"],
  ["/resume/Sufyaan_resume_data.pdf", "application/pdf"],
  ["/resume/fullstack-1.jpg", "image/jpeg"],
  ["/resume/fullstack-2.jpg", "image/jpeg"],
  ["/resume/data-1.jpg", "image/jpeg"],
  ["/projects/portfolio/desktop.jpg", "image/jpeg"],
  ["/projects/portfolio/mobile.jpg", "image/jpeg"],
]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  assert.ok(response.headers.get("content-type")?.includes(type), `${route} should serve ${type}`);
  console.log(`${response.status} ${route}`);
}
