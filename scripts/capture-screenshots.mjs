import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const pageUrl = `${process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000"}/market-rules`;
const outputDirectory = "docs/screenshots";

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

try {
  const captures = [
    {
      name: "desktop",
      viewport: { width: 1440, height: 1400 },
      isMobile: false,
    },
    {
      name: "phone",
      viewport: { width: 390, height: 844 },
      isMobile: true,
    },
  ];

  for (const capture of captures) {
    const context = await browser.newContext({
      viewport: capture.viewport,
      isMobile: capture.isMobile,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(pageUrl, { waitUntil: "networkidle" });
    await page.screenshot({
      path: `${outputDirectory}/market-rules-${capture.name}.png`,
      fullPage: false,
    });

    await context.close();
  }
} finally {
  await browser.close();
}
