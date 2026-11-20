const assert = require('node:assert/strict');

module.exports = async function testFormatting(page) {
    const answer = 'El curso se titula **Manejo Avanzado de Heridas**.\n\n' +
        'Revisa la **Ficha Técnica**:\n👉 [Ficha Técnica](https://aulavirtual.gestion22.cl/mod/resource/view.php?id=24040)\n\n' +
        '[Video de presentación](https://vimeo.com/1216289858?fl=pl&fe=cm)\n\n' +
        '*Nota importante de seguridad:* Consulta a un profesional.\n\n' +
        '- Primer paso\n- Segundo paso';
    let current = answer;
    await page.route('**/local/gestion22tutor/chat.php', route => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({
            success: true, courseId: 2, answer: current, sources: [], grounded: false, needsHumanTutor: false,
        }),
    }));
    async function ask(question) {
        const count = await page.locator('.g22-assistant').count();
        await page.locator('.g22-input').fill(question);
        await page.locator('.g22-send').click();
        await page.waitForFunction(expected => document.querySelectorAll('.g22-assistant').length === expected, count + 1);
        return page.locator('.g22-assistant').last().locator('.g22-message-body');
    }
    let body = await ask('¿De qué trata este curso?');
    assert.equal(await body.locator('strong').count(), 2);
    assert.equal(await body.locator('em').textContent(), 'Nota importante de seguridad:');
    assert.equal(await body.locator('li').count(), 2);
    const links = body.locator('a');
    assert.equal(await links.count(), 2);
    assert.equal(await links.first().textContent(), 'Ficha Técnica');
    assert.equal(await links.first().getAttribute('href'), 'https://aulavirtual.gestion22.cl/mod/resource/view.php?id=24040');
    assert.equal(await links.last().getAttribute('href'), 'https://vimeo.com/1216289858?fl=pl&fe=cm');
    assert.equal(await links.first().getAttribute('rel'), 'noopener noreferrer');
    assert.ok(!(await body.innerText()).includes('**'));
    assert.ok(!(await body.innerText()).includes('[Ficha Técnica]'));
    const box = await body.boundingBox();
    assert.ok(box && box.width > 0);
    await page.setViewportSize({width: 390, height: 844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    console.log('Bold, italic, paragraphs, lists, clickable official links and mobile: OK');

    current = '<img src=x onerror="window.g22Xss=true"> <script>window.g22Xss=true</script>\n\n' +
        '[Peligroso](javascript:alert(1)) [Datos](data:text/html,test)\n\n' +
        'https://vimeo.com/1216289858?fl=pl&fe=cm';
    body = await ask('Prueba de seguridad **texto literal del estudiante**');
    assert.equal(await body.locator('img,script').count(), 0);
    assert.ok((await body.textContent()).includes('<img'));
    assert.equal(await body.locator('a').count(), 1);
    assert.equal(await body.locator('a').getAttribute('href'), 'https://vimeo.com/1216289858?fl=pl&fe=cm');
    assert.equal(await page.evaluate(() => window.g22Xss), undefined);
    assert.ok((await page.locator('.g22-student').last().textContent()).includes('**texto literal del estudiante**'));
    console.log('Raw HTML stays text; javascript/data links blocked; student text preserved: OK');
};
