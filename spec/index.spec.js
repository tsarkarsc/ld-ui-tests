import puppeteer from "puppeteer";

const GH_SITE = "https://www.github.com";
const LL_SITE = "https://www.loblaws.ca";

let browser;
let page;

// default viewport size 
const width = 1920;
const height = 1080;

beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.setViewport({ width, height });
});

afterAll(() => {
    browser.close();
});

describe("Initial setup testing", () => {

    test("github screenshot", async () => {
        await page.goto(`${GH_SITE}`);
        await page.screenshot({ path: 'screenshots/github.png' });
    }, 16000);

    test("loblaws screenshot", async () => {
        await page.setViewport({ width:600, height:600 });
        await page.goto(`${LL_SITE}`);
        await page.screenshot({ path: 'screenshots/loblaw.png' });
    }, 16000);

});

