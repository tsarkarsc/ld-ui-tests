import puppeteer from 'puppeteer';

const LL_SITE = "https://www.loblaws.ca";
const ZR_SITE = "https://www.zehrs.ca";

// default viewport size 
const width = 1920;
const height = 1080;

let browser;
let page;

const loblaw = {
    selectors: {
        dealBadge: '.deal-badge',
        englishFrenchBtn : 'body > div.header-bar > ul > li:nth-child(3) > a',
        priceDescBtn: 'button[data-sort-type=price-desc]',
        regPriceText: 'div.product-info > div.price > div > span.reg-price > span.reg-price-text',
        // selectors such as #search-bar OR .search-form weren't working with page.click(), so I used a deeper path
        // page.click(#search-bar) was failing with node not visible 
        searchBar: '#navigation > div > div > div.search-form > form > div > div > span > span > #search-bar',
        searchBarBtn: '#navigation > div > div > div.search-form > form > div > div > span > span > button[type=submit]',
        searchModuleFrench : '.fr-search-module',
        searchResultText: 'div.result-header-content > h3 > span.term-result-found'
    }
}

beforeAll(async () => {
    // headful during development
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewport({ width, height });
});

afterEach(async () => {
    await page.setViewport({ width, height });
})

afterAll(() => {
    browser.close();
});

describe("Loblaws.ca", () => {

    test("T1 - Search for apples, and sort by price (desc)", async () => {
        await page.goto(`${LL_SITE}`);
        
        // perform search
        await page.click(loblaw.selectors.searchBar);
        await page.type(loblaw.selectors.searchBar, 'apples');
        await page.click(loblaw.selectors.searchBarBtn);
        await page.waitForNavigation();

        // sort
        await page.click(loblaw.selectors.priceDescBtn);
        await page.waitFor(2000);

        const searchResultText = await page.evaluate((searchResultText) => {
            const e = document.querySelector(searchResultText);
            return e.innerHTML;
        }, loblaw.selectors.searchResultText);
        expect(searchResultText.toLowerCase().includes('apples')).toBeTruthy();

        // extract float versions of prices from the product results
        const regPrices = await page.evaluate((regPrice) => {
            const regPrices = document.querySelectorAll(regPrice);

            let values = [];
            regPrices.forEach(e => {
                values.push(parseFloat(e.innerHTML.substring(1)));
            });

            return values;
        }, loblaw.selectors.regPriceText)

        // confirm prices are in descending order
        const n = Math.min(regPrices.length, 100);
        for (let i = 0; i < n - 1; i++) {
            expect(regPrices[i]).toBeGreaterThanOrEqual(regPrices[i + 1]);
        }

    }, 20000);

    test("T2 - Search for oranges, and confirm that deal badge exists", async () => {
        await page.goto(`${LL_SITE}`);

        // perform search
        await page.click(loblaw.selectors.searchBar);
        await page.type(loblaw.selectors.searchBar, 'oranges');
        await page.click(loblaw.selectors.searchBarBtn);
        await page.waitForNavigation();

        const searchResultText = await page.evaluate((searchResultText) => {
            const e = document.querySelector(searchResultText);
            return e.innerHTML;
        }, loblaw.selectors.searchResultText);
        expect(searchResultText.toLowerCase().includes('oranges')).toBeTruthy();

        // check for deal in initial results
        const dealBadge = await page.$(loblaw.selectors.dealBadge);
        expect(dealBadge).not.toBeNull();

    }, 20000);

    test("T3 - French version of T1", async () => {
        await page.goto(`${LL_SITE}`);

        // assume in english mode
        let englishFrenchBtnText = await page.evaluate((efbText) => {
            const e = document.querySelector(efbText);
            return e.innerHTML;
        }, loblaw.selectors.englishFrenchBtn);
        expect(englishFrenchBtnText.toLowerCase().includes('fr')).toBeTruthy();

        await page.click(loblaw.selectors.englishFrenchBtn);
        await page.waitFor(2000);

        // check switched to french mode
        englishFrenchBtnText = await page.evaluate((efbText) => {
            const e = document.querySelector(efbText);
            return e.innerHTML;
        }, loblaw.selectors.englishFrenchBtn);
        expect(englishFrenchBtnText.toLowerCase().includes('en')).toBeTruthy();

        // search module should have a french class 
        const searchModuleFrenchVer = await page.$(loblaw.selectors.searchModuleFrench);
        expect(searchModuleFrenchVer).not.toBeNull();

        // perform search
        await page.click(loblaw.selectors.searchBar);
        await page.type(loblaw.selectors.searchBar, 'pommes');
        await page.click(loblaw.selectors.searchBarBtn);
        await page.waitForNavigation();

        // sort
        await page.click(loblaw.selectors.priceDescBtn);
        await page.waitFor(2000);

        const searchResultText = await page.evaluate((searchResultText) => {
            const e = document.querySelector(searchResultText);
            return e.innerHTML;
        }, loblaw.selectors.searchResultText);
        expect(searchResultText.toLowerCase().includes('pommes')).toBeTruthy();

        // extract float versions of prices from the product results
        const regPrices = await page.evaluate((regPrice) => {
            const regPrices = document.querySelectorAll(regPrice);

            let values = [];
            regPrices.forEach(e => {
                const idxOfComma = e.innerHTML.indexOf(',');
                // convert price format from French to English, then parse float
                values.push(parseFloat(e.innerHTML.substring(0, idxOfComma) + '.' + e.innerHTML.slice(idxOfComma+1, 2)));
            });

            return values;
        }, loblaw.selectors.regPriceText)

        // confirm prices are in descending order
        const n = Math.min(regPrices.length, 100);
        for (let i = 0; i < n - 1; i++) {
            expect(regPrices[i]).toBeGreaterThanOrEqual(regPrices[i + 1]);
        }

        // go back to english mode
        await page.waitFor(2000);
        await page.click(loblaw.selectors.englishFrenchBtn);
        await page.waitFor(2000);

        // check switched back to english mode
        englishFrenchBtnText = await page.evaluate((efbText) => {
            const e = document.querySelector(efbText);
            return e.innerHTML;
        }, loblaw.selectors.englishFrenchBtn);
        expect(englishFrenchBtnText.toLowerCase().includes('fr')).toBeTruthy();

    }, 20000);

    test("T4 - French version of T2", async () => {
        await page.goto(`${LL_SITE}`);

        // assume in english mode
        let englishFrenchBtnText = await page.evaluate((efbText) => {
            const e = document.querySelector(efbText);
            return e.innerHTML;
        }, loblaw.selectors.englishFrenchBtn);
        expect(englishFrenchBtnText.toLowerCase().includes('fr')).toBeTruthy();

        await page.click(loblaw.selectors.englishFrenchBtn);
        await page.waitFor(2000);

        // check switched to french mode
        englishFrenchBtnText = await page.evaluate((efbText) => {
            const e = document.querySelector(efbText);
            return e.innerHTML;
        }, loblaw.selectors.englishFrenchBtn);
        expect(englishFrenchBtnText.toLowerCase().includes('en')).toBeTruthy();

        // search module should have a french class attached
        const searchModuleFrenchVer = await page.$(loblaw.selectors.searchModuleFrench);
        expect(searchModuleFrenchVer).not.toBeNull();

        // perform search
        await page.click(loblaw.selectors.searchBar);
        await page.type(loblaw.selectors.searchBar, 'oranges');
        await page.click(loblaw.selectors.searchBarBtn);
        await page.waitForNavigation();

        const searchResultText = await page.evaluate((searchResultText) => {
            const e = document.querySelector(searchResultText);
            return e.innerHTML;
        }, loblaw.selectors.searchResultText);
        expect(searchResultText.toLowerCase().includes('oranges')).toBeTruthy();

        // check for deal in initial results
        const dealBadge = await page.$(loblaw.selectors.dealBadge);
        expect(dealBadge).not.toBeNull();

        // go back to english mode
        await page.waitFor(2000);
        await page.click(loblaw.selectors.englishFrenchBtn);
        await page.waitFor(2000);

        // check switched back to english mode
        englishFrenchBtnText = await page.evaluate((efbText) => {
            const e = document.querySelector(efbText);
            return e.innerHTML;
        }, loblaw.selectors.englishFrenchBtn);
        expect(englishFrenchBtnText.toLowerCase().includes('fr')).toBeTruthy();

    }, 20000);

});
