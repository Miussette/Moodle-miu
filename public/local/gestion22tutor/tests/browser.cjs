// Optional local regression check: install playwright with --no-save --package-lock=false.
// Uses the existing local administrator password without printing or persisting it.
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
    const root = path.resolve(__dirname, '../../../..');
    const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
    const password = env.match(/^MOODLE_ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2');
    assert.ok(password, 'Local administrator password is configured');
    const browser = await chromium.launch({channel: 'msedge', headless: true});
    try {
        const page = await browser.newPage({viewport: {width: 1480, height: 900}});
        page.setDefaultTimeout(10000);
        page.setDefaultNavigationTimeout(30000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://localhost:8080/login/index.php', {waitUntil: 'domcontentloaded'});
        await page.locator('#username').fill('admin');
        await page.locator('#password').fill(password);
        await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 30000, waitUntil: 'domcontentloaded'}),
            page.locator('#loginbtn').click()]).catch(async error => {
                const alerts = await page.locator('.alert-danger, .loginerrors').allTextContents();
                console.error('Moodle login alerts:', alerts.map(text => text.trim()));
                throw error;
            });
        if (process.argv.includes('--module1-tutor')) {
            await page.goto('http://localhost:8080/local/gestion22tutor/module1.php?courseid=2');
            await page.locator('.g22-toggle').click();
            for (const [question, expected] of [
                ['¿Qué materiales del Módulo 1 puedes consultar? Menciona los PDF de neonato y dermatitis y las infografías.', /neonato[\s\S]*dermatitis|dermatitis[\s\S]*neonato/i],
                ['Según Manejo del neonato con piel frágil, ¿cuál es el objetivo general de la guía? Cita título y página del documento. No necesito instrucciones para atender un paciente.', /p[áa]g(?:ina|\.)?\s*\d/i],
            ]) {
                await page.locator('.g22-input').fill(question);
                const responseReady = page.waitForResponse(r => r.url().endsWith('/local/gestion22tutor/chat.php') && r.request().method() === 'POST', {timeout: 100000});
                await page.locator('.g22-send').click();
                const response = await responseReady; assert.equal(response.status(), 200);
                const result = await response.json(); assert.equal(result.success, true);
                assert.match(result.answer, expected);
                assert.ok(!/no (?:tengo|dispongo de) acceso a (?:los|ning[uú]n) documentos/i.test(result.answer));
                await page.locator('.g22-send').waitFor({state: 'visible'});
                await page.waitForFunction(() => !document.querySelector('.g22-send').disabled);
            }
            assert.equal(errors.length, 0, errors.join('\n'));
            console.log('Moodle -> tutor: module inventory and neonatal PDF answer with page citation: OK');
            return;
        }
        if (process.argv.includes('--module1-watch')) {
            await page.route('https://player.vimeo.com/video/**', route => route.abort());
            await page.route('https://player.vimeo.com/api/player*', route => route.fulfill({contentType: 'application/javascript', body: `
                define([], function() {
                    class Player {
                        constructor(iframe) { this.handlers = {}; this.ranges = []; window.testPlayers = window.testPlayers || []; window.testPlayers.push(this); }
                        ready() {return Promise.resolve();}
                        on(name, fn) {this.handlers[name] = fn;}
                        pause() {return Promise.resolve();}
                        play() {return Promise.resolve();}
                        getPlayed() {return Promise.resolve(this.ranges);}
                        getDuration() {return Promise.resolve(100);}
                    }
                    return Player;
                });` }));
            await page.goto('http://localhost:8080/local/gestion22tutor/module1.php?courseid=2');
            await page.waitForFunction(() => window.testPlayers?.length === 4);
            await page.locator('.g22l-progress').getByRole('button', {name: 'Reiniciar progreso local'}).click();
            const simulate = ranges => page.evaluate(ranges => {
                const player = window.testPlayers[0]; player.ranges = ranges;
                player.handlers.play(); player.handlers.ended();
            }, ranges);
            const video = page.locator('[data-video="video1"]');
            assert.equal(await video.getByRole('button', {name: /Confirmo/}).count(), 0);
            await simulate([[90, 100]]);
            await page.waitForFunction(() => document.querySelector('[data-video="video1"]').textContent.includes('10% reproducido'));
            assert.ok((await page.locator('.g22l-progress').textContent()).includes('0/4 videos'));
            await simulate([[0, 69.99], [90, 100]]);
            await page.waitForFunction(() => document.querySelector('[data-video="video1"]').textContent.includes('79% reproducido'));
            assert.ok((await page.locator('.g22l-progress').textContent()).includes('0/4 videos'));
            await simulate([[0, 70], [90, 100]]);
            await page.waitForFunction(() => document.querySelector('[data-video="video1"]').textContent.includes('Visto · 80%'));
            assert.ok((await page.locator('.g22l-progress').textContent()).includes('1/4 videos'));
            await page.reload();
            await page.locator('[data-video="video1"]').getByText('✓ Visto · 80% reproducido', {exact: true}).waitFor();
            assert.equal(errors.length, 0, errors.join('\n'));
            console.log('Mock Vimeo: seek-to-end rejected, 79.99% pending, 80% completed, reload persists: OK');
            return;
        }
        if (process.argv.includes('--module1-quicklinks')) {
            await page.goto('http://localhost:8080/course/section.php?id=2');
            const main = page.locator('#region-main');
            const guide = main.getByRole('link', {name: 'Ejercicios prácticos', exact: false}).first();
            await guide.click();
            await page.waitForURL('**/module1.php?courseid=2#g22l-exercises');
            await page.locator('#g22l-exercises:focus').waitFor();
            await page.locator('#courseindex').getByRole('link', {name: 'Ejercicios prácticos', exact: true}).waitFor();
            assert.equal(await page.locator('#courseindex').getByText('03 · Ejercicio: capas de la piel', {exact: true}).isVisible(), false);
            await page.goto('http://localhost:8080/course/section.php?id=2');
            const official = page.locator('#region-main').getByRole('link', {name: 'Quiz Módulo 1', exact: false}).first();
            const href = await official.getAttribute('href');
            assert.ok(href);
            // Inspect Moodle's redirect without opening an authenticated production attempt.
            const response = await page.request.get(href, {maxRedirects: 0});
            assert.equal(response.headers().location, 'https://aulavirtual.gestion22.cl/mod/quiz/view.php?id=24059');
            assert.equal(errors.length, 0, errors.join('\n'));
            console.log('Native quick access opens and focuses assessment; quiz redirects to production view: OK');
            return;
        }
        if (process.argv.includes('--module1-layout')) {
            await require('./module1-browser.cjs').layout(page);
            return;
        }
        if (process.argv.includes('--module1-vimeo')) {
            await require('./module1-browser.cjs').checkVimeo(page);
            return;
        }
        if (process.argv.includes('--module1')) {
            await require('./module1-browser.cjs')(page);
            return;
        }
        if (process.argv.includes('--intro-shortcuts')) {
            await page.goto('http://localhost:8080/course/view.php?id=2');
            await page.locator('#courseindex').getByText('Introducción', {exact: true}).click();
            const grid = page.locator('.g22-course-shortcuts');
            await grid.waitFor();
            assert.equal(await grid.locator('a').count(), 10);
            const destinations = await grid.locator('a').evaluateAll(links => links.map(link => link.href));
            assert.equal(destinations.filter(url => url.startsWith('http://localhost:8080/course/section.php?id=')).length, 8);
            for (const url of destinations.filter(url => url.startsWith('http://localhost:8080/'))) {
                assert.equal((await page.request.get(url)).status(), 200);
            }
            for (const width of [1480, 390]) {
                await page.setViewportSize({width, height: 900});
                await grid.scrollIntoViewIfNeeded();
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
                await grid.screenshot({path: path.join(root, `.cache/introduction-shortcuts-${width}.png`)});
            }
            console.log('Ten introduction cards, eight valid local destinations and responsive layout: OK');
            return;
        }
        if (process.argv.includes('--introduction')) {
            await page.goto('http://localhost:8080/course/view.php?id=2');
            const index = page.locator('#courseindex');
            await index.getByText('Introducción', {exact: true}).waitFor();
            const main = page.locator('#region-main');
            await main.getByRole('heading', {name: 'Introducción', exact: true}).waitFor();
            assert.ok((await main.textContent()).includes('Manejo Avanzado de Heridas de Difícil Cicatrización'));
            assert.ok((await main.textContent()).includes('100%'));
            assert.equal(await main.locator('a[href="mailto:aulavirtual@gestion22.cl"]').count(), 1);
            const player = main.locator('iframe[title="Presentación del Curso"]');
            await player.waitFor({state: 'visible'});
            assert.equal(await player.getAttribute('src'), 'https://player.vimeo.com/video/1216289858?dnt=1');
            const desktop = await player.boundingBox();
            assert.ok(desktop && desktop.width > 600 && Math.abs(desktop.width / desktop.height - 16 / 9) < 0.02);
            for (const title of ['Ficha Técnica (aula de producción)', 'Video de presentación de la docente (Vimeo)',
                'Foro Consultas al Docente (aula de producción)', 'Examen Final (aula de producción)']) {
                await main.getByRole('link', {name: title, exact: false}).first().waitFor();
            }
            await player.scrollIntoViewIfNeeded();
            const frame = await player.elementHandle().then(handle => handle.contentFrame());
            if (frame) {
                await frame.waitForLoadState('domcontentloaded', {timeout: 15000}).catch(() => {});
                const loaded = await frame.locator('video').first().waitFor({state: 'attached', timeout: 20000})
                    .then(() => true).catch(() => false);
                console.log('Vimeo video element loaded:', loaded);
                if (!loaded) console.log('Vimeo player text:',
                    (await frame.locator('body').innerText({timeout: 5000}).catch(() => 'Not available')).slice(0, 600));
            }
            fs.mkdirSync(path.join(root, '.cache'), {recursive: true});
            await page.screenshot({path: path.join(root, '.cache/gestion22-introduction-desktop.png')});
            await page.setViewportSize({width: 390, height: 844});
            await page.waitForTimeout(500);
            const mobile = await player.boundingBox();
            assert.ok(mobile && mobile.width > 200 && mobile.width <= 390 &&
                Math.abs(mobile.width / mobile.height - 16 / 9) < 0.02);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            console.log('Introduction and large embedded Vimeo player visible; desktop/mobile 16:9, welcome and 4 links: OK');
            return;
        }
        for (const url of ['/local/gestion22tutor/index.php?courseid=2', '/course/view.php?id=2']) {
            await page.goto(`http://localhost:8080${url}`);
            await page.locator('body > #gestion22-chat[data-initialized="true"]').waitFor();
            const toggle = page.locator('.g22-toggle');
            await toggle.click();
            assert.equal(await page.locator('.g22-panel').isVisible(), true);
            await page.locator('.g22-close').click();
            assert.equal(await page.locator('.g22-panel').isVisible(), false);
            const footer = page.locator('[data-action="footer-popover"]');
            await footer.click();
            await page.waitForTimeout(350);
            assert.equal(await page.locator('#gestion22-chat').count(), 1, 'Help must not clone the chat');
            await toggle.click();
            assert.equal(await page.locator('.g22-panel').isVisible(), true);
            await page.locator('.g22-input').press('Escape');
            assert.equal(await page.locator('.g22-panel').isVisible(), false);
            console.log(`Open, close, Escape and footer independence: ${url} OK`);
        }
        await page.locator('.g22-toggle').click();
        if (process.argv.includes('--video-navigation')) {
            await page.locator('.g22-input').fill('¿Dónde puedo ver el video de presentación de la docente? Incluye el enlace.');
            const response = page.waitForResponse(r => r.url().endsWith('/local/gestion22tutor/chat.php') &&
                r.request().method() === 'POST', {timeout: 100000});
            await page.locator('.g22-send').click();
            const result = await response;
            assert.equal(result.status(), 200);
            const data = await result.json();
            assert.ok(data.answer.includes('http://localhost:8080/course/section.php?id=6'));
            assert.ok(!data.answer.includes('https://vimeo.com/'));
            const link = page.locator('.g22-assistant').last().locator('a[href="http://localhost:8080/course/section.php?id=6"]').first();
            await link.waitFor();
            const popup = page.waitForEvent('popup');
            await link.click();
            const introduction = await popup;
            await introduction.waitForURL('**/course/section.php?id=6', {waitUntil: 'domcontentloaded'});
            await introduction.locator('iframe[title="Presentación del Curso"]').waitFor();
            console.log('Real Gemini answer -> chat video link -> local Introduction with embedded player: OK');
            return;
        }
        if (process.argv.includes('--formatting')) {
            await require('./formatting-browser.cjs')(page);
            assert.deepEqual(errors, [], 'No browser JavaScript errors');
            return;
        }
        if (process.argv.includes('--course-context')) {
            await require('./course-context-browser.cjs')(page);
            assert.deepEqual(errors, [], 'No browser JavaScript errors');
            return;
        }
        await page.locator('.g22-input').fill('Explica el aprendizaje activo en una frase.');
        const response = page.waitForResponse(r => r.url().endsWith('/local/gestion22tutor/chat.php') &&
            r.request().method() === 'POST', {timeout: 100000});
        await page.locator('.g22-send').click();
        const result = await response;
        assert.equal(result.status(), 200);
        const data = await result.json();
        assert.equal(data.success, true);
        await page.waitForFunction(() => document.querySelectorAll('.g22-assistant').length === 2);
        assert.ok((await page.locator('.g22-assistant').last().locator('.g22-message-body').innerText()).length > 0);
        console.log('Authenticated browser -> PHP -> Gemini -> rendered answer: OK');
        await page.setViewportSize({width: 390, height: 844});
        await page.waitForTimeout(500);
        const box = await page.locator('.g22-panel').boundingBox();
        assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const help = await page.locator('[data-action="footer-popover"]').boundingBox();
        const button = await page.locator('.g22-toggle').boundingBox();
        assert.ok(button && (!help || button.y + button.height <= help.y), 'Chat must not overlap Moodle help');
        console.log('Mobile viewport, panel bounds and help-button separation: OK');
        fs.mkdirSync(path.join(root, '.cache'), {recursive: true});
        await page.screenshot({path: path.join(root, '.cache/gestion22-chat-mobile.png')});
        await page.setViewportSize({width: 1480, height: 900});
        await page.screenshot({path: path.join(root, '.cache/gestion22-chat-desktop.png')});
        assert.deepEqual(errors, [], 'No browser JavaScript errors');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
