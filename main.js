#! /usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const BLI_CONFIG = {
    login_url: 'https://brain-dock-dot-splink-neuro-science-dev.appspot.com/signin',
    login_user: process.env.LOGIN_USER,
    login_password: process.env.LOGIN_PASSWORD,
    report_url_base: 'https://brain-dock-dot-splink-neuro-science-dev.appspot.com/reports',
    id_list: 'bli.txt',
    name_input: 'patientName',
}
const SA_CONFIG = {
    login_url: 'https://web-dot-splink-neuro-science-dev.appspot.com/signin',
    login_user: process.env.LOGIN_USER_SA,
    login_password: process.env.LOGIN_PASSWORD_SA,
    report_url_base: 'https://web-dot-splink-neuro-science-dev.appspot.com/reports',
    id_list: 'sa.txt',
    name_input: 'name',
}

const config = SA_CONFIG;

class Target {
    constructor(id, date, patient_id) {
        this.id = id;
        this.date = date;
        this.patient_id = patient_id;
    }

    get url() {
        return `${config.report_url_base}/${this.id}/${this.date}/`
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

const login = async (page, config) => {
    await page.goto(config.login_url, {
        waitUntil: 'networkidle0'
    });
    await page.type('[name=email]', config.login_user);
    await page.type('[name=password]', config.login_password);

    return Promise.all([
        page.waitForNavigation({
            waitUntil: 'networkidle0'
        }),
        page.click('button'),
    ]);
}

const inputName = async (config, page, id) => {
    await page.type(`[name=${config.name_input}]`, id);

    await page.click('button');

    page.waitFor(1000);
}


(async () => {
    const targets = await readTargets(config.id_list);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();


    console.log('login')
    await login(page, config);

    for (const t of targets) {
        console.log(`process ${t.toString}`);
        await page.goto(t.url, {
            waitUntil: 'networkidle0',
            timeout: 5 * 60 * 1000
        });

        await inputName(config, page, t.name);

        await page.pdf({
            path: t.filename,
        });
    }

    await browser.close();
})();
