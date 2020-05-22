#! /usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const ID_LIST = 'list.txt';

class Target {
    constructor(id, date, patient_id) {
        this.id = id;
        this.date = date;
        this.patient_id = patient_id;
    }

    get url() {
        return `https://web-dot-splink-neuro-science-dev.appspot.com/reports/${this.id}/${this.date}`
    }

    get name() {
        return this.id
    }

    get filename() {
        return `out/${this.patient_id}-${this.date}.pdf`
    }

    get toString() {
        return `Target(${this.id}, ${this.date}, ${this.patient_id})`
    }
}


const readTargets = async (path) => {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let ret = [];
    for await (const line of rl) {
        const es = line.split('\t');
        ret.push(new Target(es[0], '2020-05-11', es[1]));
    }
    return ret;
}

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
    const targets = await readTargets(ID_LIST);
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
