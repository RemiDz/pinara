import puppeteer from "puppeteer-core";

const url = process.argv[2] || "http://localhost:3001/";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();

const consoleMsgs = [];
const pageErrors = [];

page.on("console", (msg) => {
  consoleMsgs.push({ type: msg.type(), text: msg.text(), loc: msg.location() });
});
page.on("pageerror", (err) => {
  pageErrors.push({ name: err.name, message: err.message, stack: err.stack });
});
page.on("requestfailed", (req) => {
  consoleMsgs.push({ type: "requestfailed", text: `${req.method()} ${req.url()} ${req.failure()?.errorText}` });
});

try {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
} catch (err) {
  console.error("navigation:", err.message);
}

await new Promise((r) => setTimeout(r, 1500));

console.log("=== PAGE ERRORS ===");
for (const e of pageErrors) {
  console.log(`${e.name}: ${e.message}`);
  if (e.stack) console.log(e.stack.split("\n").slice(0, 8).join("\n"));
  console.log("---");
}

console.log("=== CONSOLE (filtered) ===");
for (const m of consoleMsgs) {
  if (m.type === "error" || m.type === "warning" || m.type === "requestfailed") {
    console.log(`[${m.type}] ${m.text}`);
    if (m.loc?.url) console.log(`  at ${m.loc.url}:${m.loc.lineNumber}`);
  }
}

const html = await page.content();
console.log("=== body length ===", html.length);
const visibleText = await page.evaluate(() => document.body.innerText.slice(0, 800));
console.log("=== visible text (first 800 chars) ===");
console.log(visibleText);

await browser.close();
