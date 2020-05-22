#! /usr/bin/env node

const puppeteer = require('puppeteer');
require('dotenv').config();

class Target {
    constructor(id, date) {
        this.id = id;
        this.date = date;
    }

    get url() {
        return `https://web-dot-splink-neuro-science-dev.appspot.com/reports/${this.id}/${this.date}`
    }

    get name() {
        return 'test'
    }

    get filename() {
        return `out/${this.id}-${this.date}.pdf`
    }

    get toString() {
        return `Target(${this.id}, ${this.date})`
    }
}


const targets = [
    new Target('4699', '2020-05-11')
]

const login = async (page) => {
    await page.goto(process.env.LOGIN_URL, {
        waitUntil: 'networkidle0'
    });
    await page.type('[name=email]', process.env.LOGIN_USER);
    await page.type('[name=password]', process.env.LOGIN_PASSWORD);

    return Promise.all([
        page.waitForNavigation({
            waitUntil: 'networkidle0'
        }),
        page.click('div.Authform, div, button'),
    ]);
}

const inputName = async (page, id) => {
    await page.type('[name=name]', id);

    await page.click('button');

    page.waitFor(1000);
}


(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();


    console.log('login')
    await login(page);

    for (const t of targets) {
        console.log(`process ${t.toString}`);
        await page.goto(t.url, {
            waitUntil: 'networkidle0',
            timeout: 5 * 60 * 1000
        });

        await inputName(page, t.name);

        await page.pdf({
            path: t.filename,
        });
    }

    await browser.close();
})();
