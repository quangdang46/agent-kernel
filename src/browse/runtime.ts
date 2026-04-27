import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { chromium, type Browser, type Page } from "playwright";

import { loadBrowseConfig, type BrowseConfig } from "../config.js";

export interface BrowseRequest {
  url: string;
  selector?: string;
}

export interface BrowsePageMetadata {
  title: string;
  url: string;
}

export interface BrowseLink {
  href: string;
  text: string;
}

export interface BrowseScreenshotResult extends BrowsePageMetadata {
  path: string;
}

async function withPage<T>(
  request: BrowseRequest,
  config: BrowseConfig,
  action: (page: Page) => Promise<T>,
): Promise<T> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: config.BROWSE_HEADLESS,
    });

    const context = await browser.newContext({
      viewport: {
        width: config.BROWSE_VIEWPORT_WIDTH,
        height: config.BROWSE_VIEWPORT_HEIGHT,
      },
    });

    const page = await context.newPage();
    await page.goto(request.url, {
      timeout: config.BROWSE_TIMEOUT_MS,
      waitUntil: "domcontentloaded",
    });

    return await action(page);
  } finally {
    await browser?.close();
  }
}

async function readMetadata(page: Page): Promise<BrowsePageMetadata> {
  return {
    title: await page.title(),
    url: page.url(),
  };
}

function defaultArtifactPath(config: BrowseConfig, suffix: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return resolve(config.BROWSE_ARTIFACT_DIR, `browse-${stamp}-${suffix}`);
}

export async function readPageText(
  request: BrowseRequest,
  config: BrowseConfig = loadBrowseConfig(),
): Promise<BrowsePageMetadata & { text: string }> {
  return withPage(request, config, async (page) => {
    const text = request.selector
      ? await page.locator(request.selector).innerText()
      : await page.locator("body").innerText();

    return {
      ...(await readMetadata(page)),
      text,
    };
  });
}

export async function readPageHtml(
  request: BrowseRequest,
  config: BrowseConfig = loadBrowseConfig(),
): Promise<BrowsePageMetadata & { html: string }> {
  return withPage(request, config, async (page) => {
    const html = request.selector
      ? await page.locator(request.selector).innerHTML()
      : await page.content();

    return {
      ...(await readMetadata(page)),
      html,
    };
  });
}

export async function readPageLinks(
  request: BrowseRequest,
  config: BrowseConfig = loadBrowseConfig(),
): Promise<BrowsePageMetadata & { links: BrowseLink[] }> {
  return withPage(request, config, async (page) => {
    const links = await page.locator("a[href]").evaluateAll((elements) =>
      elements.map((element) => ({
        href: (element as HTMLAnchorElement).href,
        text: element.textContent?.trim() ?? "",
      })),
    );

    return {
      ...(await readMetadata(page)),
      links,
    };
  });
}

export async function capturePageScreenshot(
  request: BrowseRequest & {
    path?: string;
  },
  config: BrowseConfig = loadBrowseConfig(),
): Promise<BrowseScreenshotResult> {
  return withPage(request, config, async (page) => {
    const outputPath = resolve(
      request.path ?? defaultArtifactPath(config, "screenshot.png"),
    );
    await mkdir(dirname(outputPath), { recursive: true });

    if (request.selector) {
      await page.locator(request.selector).screenshot({
        path: outputPath,
      });
    } else {
      await page.screenshot({
        fullPage: true,
        path: outputPath,
      });
    }

    return {
      ...(await readMetadata(page)),
      path: outputPath,
    };
  });
}

export async function verifyBrowseRuntime(
  config: BrowseConfig = loadBrowseConfig(),
): Promise<
  | {
      browserVersion: string;
      ok: true;
      title: string;
    }
  | {
      error: string;
      ok: false;
      requiresBrowserInstall?: boolean;
    }
> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: config.BROWSE_HEADLESS,
    });

    const context = await browser.newContext({
      viewport: {
        width: config.BROWSE_VIEWPORT_WIDTH,
        height: config.BROWSE_VIEWPORT_HEIGHT,
      },
    });
    const page = await context.newPage();
    await page.goto(
      "data:text/html,<html><head><title>Agent Kernel Browse OK</title></head><body>ok</body></html>",
      {
        timeout: config.BROWSE_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      },
    );

    return {
      browserVersion: browser.version(),
      ok: true,
      title: await page.title(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      error: message,
      ok: false,
      requiresBrowserInstall:
        message.includes("Executable doesn't exist") ||
        message.includes("Please run the following command"),
    };
  } finally {
    await browser?.close();
  }
}
