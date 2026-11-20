const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../gestion22-ai-api/data/module1.json'), 'utf8'));

module.exports = async function module1Test(page) {
    // Exercise the restricted-player path without pretending videos were played.
    await page.route('https://player.vimeo.com/**', route => route.abort());
    await page.goto('http://localhost:8080/course/view.php?id=2', {waitUntil: 'domcontentloaded'});
    await page.locator('#courseindex').getByText('Módulo 1', {exact: true}).waitFor();
    await page.locator('#region-main').getByRole('link', {name: 'Módulo 1 · Experiencia interactiva', exact: false}).first().waitFor();
    await page.goto('http://localhost:8080/local/gestion22tutor/module1.php?courseid=2', {waitUntil: 'domcontentloaded'});
    await page.locator('.g22l-hero h1').waitFor();
    await page.evaluate(() => {for (const key of Object.keys(localStorage)) if (key.startsWith('g22-module1:')) localStorage.removeItem(key);});
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.locator('.g22l-hero h1').waitFor();
    assert.ok((await page.locator('.g22l-warning').textContent()).includes('Pendiente de revisión'));
    assert.equal(await page.locator('.g22l-video-frame iframe').count(), 4);
    for (const video of content.videos) {
        assert.equal(await page.locator(`[data-video="${video.id}"] iframe`).getAttribute('src'), `https://player.vimeo.com/video/${video.vimeoId}?dnt=1`);
    }
    assert.ok((await page.locator('.g22l-progress').textContent()).includes('0/4 videos'));
    assert.equal(await page.getByRole('button', {name: 'Confirmo que revisé este video (autodeclarado)'}).count(), 0);
    assert.ok((await page.locator('.g22l-progress').textContent()).includes('0/4 videos'));
    console.log('Course section, AMD page, four original video frames and no manual completion: OK');

    const anatomy = page.locator('[data-activity="anatomy"]');
    await page.getByRole('button', {name: '03 · Ejercicios prácticos', exact: true}).click();
    for (const layer of content.layers) {
        await anatomy.getByRole('button', {name: layer.title, exact: true}).click();
        await anatomy.locator('input[type=radio]').nth(layer.question.correct).check();
        await anatomy.getByRole('button', {name: 'Comprobar respuesta'}).click();
    }
    assert.equal(await anatomy.locator('.g22l-badge').textContent(), '✓ Completada');
    const risks = page.locator('[data-activity="risks"]');
    for (const [index, risk] of content.risks.entries()) {
        await risks.locator('.g22l-risk').nth(index).locator('select').nth(0).selectOption(risk.example);
        await risks.locator('.g22l-risk').nth(index).locator('select').nth(1).selectOption(risk.consequence);
    }
    await risks.getByRole('button', {name: 'Comprobar respuestas'}).click();
    assert.equal(await risks.locator('.g22l-badge').textContent(), '✓ Completada');
    const assessment = page.locator('[data-activity="assessment"]');
    await assessment.getByRole('button', {name: 'Vista posterior'}).click();
    for (const zone of content.zones) {
        await assessment.getByRole('button', {name: zone, exact: true}).click();
        await assessment.locator('.g22l-info select').selectOption('Sin hallazgos simulados');
        await assessment.getByRole('button', {name: 'Registrar zona'}).click();
    }
    assert.equal(await assessment.locator('.g22l-badge').textContent(), '✓ Completada');
    console.log('Anatomy exploration, associations and head-to-toe simulated assessment: OK');

    const checklist = page.locator('[data-activity="checklist"]');
    await checklist.getByLabel('Fecha de simulación').fill('2026-11-10');
    await checklist.getByLabel('Servicio o unidad simulada').selectOption('Unidad simulada A');
    for (const item of content.checklist) await checklist.getByLabel(item, {exact: true}).selectOption('Normal en la simulación');
    for (const field of ['Ubicación de hallazgos ficticios', 'Observaciones generales de la simulación', 'Plan educativo de cuidados', 'Reevaluación programada de la simulación']) {
        await checklist.getByLabel(field, {exact: true}).fill('Dato ficticio de práctica, sin paciente real.');
    }
    await checklist.getByRole('button', {name: 'Generar resumen de práctica'}).click();
    assert.equal(await checklist.locator('.g22l-summary').textContent(), '');
    await checklist.locator('input[type=checkbox]').check();
    await checklist.getByRole('button', {name: 'Generar resumen de práctica'}).click();
    assert.ok((await checklist.locator('.g22l-summary').textContent()).includes('NO VÁLIDA COMO REGISTRO CLÍNICO'));
    const downloadEvent = page.waitForEvent('download');
    await checklist.getByRole('button', {name: 'Exportar resumen de práctica (.txt)'}).click();
    const download = await downloadEvent; assert.ok(download.suggestedFilename().includes('NO-REGISTRO-CLINICO'));

    const scenario = page.locator('[data-activity="case"]');
    for (const [index, question] of content.caseSteps.entries()) {
        if (index === 0) {
            await scenario.locator('input[type=radio]').nth(0).check();
            await scenario.getByRole('button', {name: 'Comprobar respuesta'}).click();
            assert.equal(await scenario.getByRole('button', {name: 'Continuar a la siguiente etapa'}).isEnabled(), false);
            assert.equal(await scenario.locator('.g22l-remediation').isVisible(), true);
        }
        await scenario.locator('input[type=radio]').nth(question.correct).check();
        await scenario.getByRole('button', {name: 'Comprobar respuesta'}).click();
        await scenario.getByRole('button', {name: 'Continuar a la siguiente etapa'}).click();
    }
    assert.equal(await scenario.locator('.g22l-badge').textContent(), '✓ Completada');
    const practice = page.locator('[data-activity="practice"]');
    for (const [index, question] of content.quiz.entries()) {
        const field = practice.locator('fieldset').nth(index);
        if (question.kind === 'matching') {
            for (const [i, pair] of question.pairs.entries()) await field.locator('select').nth(i).selectOption(pair.right);
        } else await field.locator('input[type=radio]').nth(question.correct).check();
        await field.getByRole('button', {name: 'Comprobar respuesta'}).click();
    }
    assert.equal(await practice.locator('.g22l-badge').textContent(), '✓ Completada');
    const stored = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.startsWith('g22-module1:')));
    assert.ok(stored.every(([, value]) => !value.includes('Dato ficticio')));
    assert.ok((await page.locator('.g22l-progress').textContent()).includes('6/6 actividades'));
    console.log('Checklist validation/export, predefined branching case, mixed practice and nonsensitive storage: OK');

    await anatomy.getByRole('button', {name: 'Preguntar al Tutor IA'}).click();
    await page.locator('.g22-panel').waitFor({state: 'visible'});
    assert.ok((await page.locator('.g22-input').inputValue()).includes('Hipodermis'));
    const response = page.waitForResponse(r => r.url().endsWith('/local/gestion22tutor/chat.php') && r.request().method() === 'POST', {timeout: 100000});
    await page.locator('.g22-send').click();
    const result = await response; assert.equal(result.status(), 200);
    const sent = new URLSearchParams(result.request().postData());
    assert.equal(sent.get('activityid'), 'anatomy'); assert.equal(sent.get('concept'), 'anatomy');
    assert.ok(!result.request().postData().includes('Dato ficticio'));
    const answer = await result.json(); assert.equal(answer.success, true); assert.equal(answer.grounded, false);
    console.log('Activity -> existing chat -> authenticated PHP -> Gemini with supplied concept fragments: OK');
    await page.locator('.g22-close').click();
    await page.setViewportSize({width: 390, height: 844});
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    fs.mkdirSync(path.resolve(__dirname, '../../../../.cache'), {recursive: true});
    await page.locator('.g22l-hero').scrollIntoViewIfNeeded();
    await page.screenshot({path: path.resolve(__dirname, '../../../../.cache/module1-mobile.png')});
    await page.setViewportSize({width: 1480, height: 900});
    await page.screenshot({path: path.resolve(__dirname, '../../../../.cache/module1-desktop.png')});
    console.log('Mobile layout without horizontal overflow: OK');
};

module.exports.checkVimeo = async function checkVimeo(page) {
    await page.goto('http://localhost:8080/local/gestion22tutor/module1.php?courseid=2', {waitUntil: 'domcontentloaded'});
    await page.locator('.g22l-hero h1').waitFor();
    await page.waitForTimeout(20000);
    for (const video of content.videos) {
        const frame = await page.locator(`[data-video="${video.id}"] iframe`).elementHandle().then(node => node.contentFrame());
        const text = frame ? await frame.locator('body').innerText({timeout: 3000}).catch(() => 'Frame unavailable') : 'Frame unavailable';
        const media = frame ? await frame.locator('video').count() : 0;
        console.log(`${video.title} (${video.vimeoId}): media element=${media}; player=${text.trim().slice(0, 220)}`);
        console.log(await page.locator(`[data-video="${video.id}"] .g22l-feedback`).textContent());
    }
};

module.exports.layout = async function layout(page) {
    await page.route('https://player.vimeo.com/**', route => route.abort());
    await page.goto('http://localhost:8080/local/gestion22tutor/module1.php?courseid=2', {waitUntil: 'domcontentloaded'});
    await page.locator('.g22l-hero h1').waitFor();
    await page.getByRole('button', {name: '02 · Infografías', exact: true}).click();
    assert.equal(await page.locator('#g22l-infographics details').count(), 4);
    for (const details of await page.locator('#g22l-infographics details').all()) {
        await details.evaluate(node => {node.open = true;});
        await details.locator('img').scrollIntoViewIfNeeded();
        await details.locator('img').evaluate(img => img.decode());
        assert.ok(await details.locator('img').evaluate(img => img.naturalWidth > 0));
        assert.equal(await details.locator('a').getAttribute('href'), await details.locator('img').getAttribute('src'));
    }
    assert.equal(await page.locator('#g22l-videos').isVisible(), false);
    await page.getByRole('button', {name: '03 · Ejercicios prácticos', exact: true}).click();
    const anatomy = page.locator('[data-activity="anatomy"]');
    const illustration = anatomy.locator('.g22l-skin-image');
    await illustration.waitFor();
    await illustration.evaluate(img => img.decode());
    assert.ok(await illustration.evaluate(img => img.naturalWidth > 0));
    for (const width of [390, 1480]) {
        await page.setViewportSize({width, height: width === 390 ? 844 : 900});
        await page.waitForTimeout(400);
        if (width === 390) {
            const close = page.locator('#theme_boost-drawers-courseindex [data-action="closedrawer"]');
            if (await close.isVisible()) await close.click();
            await page.waitForTimeout(400);
        }
        const box = await page.locator('.g22l-hero').boundingBox();
        assert.ok(box && box.width <= width && box.x >= 0 && box.x + box.width <= width);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        for (const layer of content.layers) {
            await anatomy.getByRole('button', {name: layer.title, exact: true}).click();
            assert.equal(await anatomy.locator('.g22l-info h3').textContent(), layer.title);
        }
        await anatomy.scrollIntoViewIfNeeded();
        await anatomy.screenshot({path: path.resolve(__dirname, `../../../../.cache/anatomy-${width}.png`)});
        const risks = page.locator('[data-activity="risks"]');
        const fields = risks.locator('.g22l-risk').first().locator('select');
        const exampleBox = await fields.nth(0).boundingBox();
        const consequenceBox = await fields.nth(1).boundingBox();
        assert.ok(width > 600 ? Math.abs(exampleBox.y - consequenceBox.y) < 2 : consequenceBox.y > exampleBox.y);
        for (const [index, risk] of content.risks.entries()) {
            await risks.locator('.g22l-risk').nth(index).locator('select').nth(0).selectOption(risk.example);
            await risks.locator('.g22l-risk').nth(index).locator('select').nth(1).selectOption(risk.consequence);
        }
        assert.equal(await risks.locator('.g22l-risk-counter').textContent(), `${content.risks.length * 2} de ${content.risks.length * 2} respuestas completadas`);
        await risks.getByRole('button', {name: 'Comprobar respuestas', exact: true}).click();
        assert.equal(await risks.locator('.g22l-badge').textContent(), '✓ Completada');
        await risks.getByRole('button', {name: 'Reintentar', exact: true}).click();
        assert.equal(await risks.locator('.g22l-risk-counter').textContent(), `0 de ${content.risks.length * 2} respuestas completadas`);
        await risks.screenshot({path: path.resolve(__dirname, `../../../../.cache/risks-${width}.png`)});
        const checklist = page.locator('[data-activity="checklist"]');
        assert.equal(await checklist.locator('fieldset').count(), 3);
        assert.equal(await checklist.locator('progress').getAttribute('value'), '0');
        await checklist.getByLabel('Fecha de simulación').fill('2026-11-11');
        for (const select of await checklist.locator('select').all()) await select.selectOption({index: 1});
        for (const textarea of await checklist.locator('textarea').all()) await textarea.fill('Hallazgo ficticio de práctica.');
        await checklist.locator('input[type=checkbox]').check();
        assert.ok(await checklist.locator('progress').evaluate(node => node.value === node.max));
        await checklist.getByRole('button', {name: 'Generar resumen de práctica', exact: true}).click();
        assert.ok((await checklist.locator('.g22l-summary').textContent()).includes('NO VÁLIDA COMO REGISTRO CLÍNICO'));
        const downloadReady = page.waitForEvent('download');
        await checklist.getByRole('button', {name: 'Exportar resumen de práctica (.txt)', exact: true}).click();
        assert.ok((await downloadReady).suggestedFilename().endsWith('.txt'));
        await checklist.getByRole('button', {name: 'Reiniciar checklist', exact: true}).click();
        assert.equal(await checklist.getByLabel('Paciente ficticio').inputValue(), 'SIM-076');
        assert.equal(await checklist.locator('progress').getAttribute('value'), '0');
        await checklist.screenshot({path: path.resolve(__dirname, `../../../../.cache/checklist-${width}.png`)});
        const assessment = page.locator('[data-activity="assessment"]');
        await assessment.locator('.g22l-adult-image').evaluate(img => img.decode());
        for (const view of ['Vista frontal', 'Vista posterior']) {
            await assessment.getByRole('button', {name: view, exact: true}).click();
            assert.equal(await assessment.getByRole('button', {name: view, exact: true}).getAttribute('aria-pressed'), 'true');
            await assessment.getByRole('button', {name: 'Cabeza', exact: true}).click();
            assert.equal(await assessment.locator('.g22l-info h3').textContent(), 'Cabeza');
            await assessment.locator('.g22l-body').screenshot({path: path.resolve(__dirname,
                `../../../../.cache/adult-${width}-${view === 'Vista frontal' ? 'front' : 'back'}.png`)});
        }
        await page.locator('.g22l-hero').scrollIntoViewIfNeeded();
        await page.screenshot({path: path.resolve(__dirname, `../../../../.cache/module1-${width === 390 ? 'mobile' : 'desktop'}.png`)});
    }
    console.log('Module content visible with drawer closed; desktop/mobile screenshots and bounds: OK');
};
