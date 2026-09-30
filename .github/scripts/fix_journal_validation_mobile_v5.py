from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing patch anchor: {label}')
    return text.replace(old, new, 1)


journal = Path('lunea-reading-journal-v2.js')
s = journal.read_text()

s = replace_once(
    s,
    """      const btn = document.createElement('button');\n      btn.className = 'mini' + (entry.status === key ? ' on' : '');""",
    """      const btn = document.createElement('button');\n      btn.type = 'button';\n      btn.className = 'mini' + (entry.status === key ? ' on' : '');""",
    'status button type'
)

s = replace_once(
    s,
    """    const saveBtn = document.createElement('button');\n    saveBtn.className = 'mini lj-save';""",
    """    const saveBtn = document.createElement('button');\n    saveBtn.type = 'button';\n    saveBtn.className = 'mini lj-save';""",
    'save button type'
)

s = replace_once(
    s,
    """      saveBtn.textContent = '✓ 저장됨';\n      setTimeout(() => rerender(entry.id), 250);""",
    """      saveBtn.textContent = '✓ 저장됨';\n      setTimeout(() => {\n        if (saveBtn.isConnected) saveBtn.textContent = '✓ 검증 내용 저장';\n      }, 900);""",
    'save without rerender'
)

s = replace_once(
    s,
    """    const mk = text => {\n      const btn = document.createElement('button');\n      btn.className = 'mini';""",
    """    const mk = text => {\n      const btn = document.createElement('button');\n      btn.type = 'button';\n      btn.className = 'mini';""",
    'action button type'
)

s = replace_once(
    s,
    """    reviewBtn.onclick = () => review.classList.toggle('open');""",
    """    reviewBtn.onclick = event => {\n      event?.preventDefault?.();\n      event?.stopPropagation?.();\n      const modal = $('archiveOverlay')?.querySelector('.archive-modal') || $('archiveOverlay')?.querySelector('.modal');\n      const scrollTop = modal?.scrollTop || 0;\n      review.classList.toggle('open');\n      if (modal) {\n        modal.scrollTop = scrollTop;\n        requestAnimationFrame(() => { modal.scrollTop = scrollTop; });\n        setTimeout(() => { if (review.isConnected) modal.scrollTop = scrollTop; }, 60);\n      }\n    };""",
    'review toggle scroll preservation'
)

journal.write_text(s)

header = Path('lunea-journal-header-fix-v1.js')
h = header.read_text()
old_css = """      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid .lj-field input[type='date'],\n      #archiveOverlay .lj-review .lj-grid .lj-field input[type='date']{\n        min-width:0!important;\n        width:100%!important;\n        max-width:158px!important;\n        padding-left:6px!important;\n        padding-right:4px!important;\n        font-size:10px!important;\n        justify-self:start!important;\n      }"""
new_css = """      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid .lj-field input[type='date'],\n      #archiveOverlay .lj-review .lj-grid .lj-field input[type='date']{\n        -webkit-appearance:none!important;\n        appearance:none!important;\n        box-sizing:border-box!important;\n        min-width:0!important;\n        width:100%!important;\n        max-width:100%!important;\n        height:38px!important;\n        min-height:38px!important;\n        max-height:38px!important;\n        padding:0 8px!important;\n        font-size:10px!important;\n        line-height:38px!important;\n        text-align:center!important;\n        justify-self:stretch!important;\n        border-radius:10px!important;\n      }\n      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid .lj-field input[type='date']::-webkit-date-and-time-value,\n      #archiveOverlay .lj-review .lj-grid .lj-field input[type='date']::-webkit-date-and-time-value{\n        box-sizing:border-box!important;\n        width:100%!important;\n        margin:0!important;\n        padding:0!important;\n        text-align:center!important;\n      }\n      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid .lj-field input[type='date']::-webkit-datetime-edit,\n      #archiveOverlay .lj-review .lj-grid .lj-field input[type='date']::-webkit-datetime-edit{\n        display:flex!important;\n        align-items:center!important;\n        justify-content:center!important;\n        width:100%!important;\n        margin:0!important;\n        padding:0!important;\n      }"""
h = replace_once(h, old_css, new_css, 'compact centered mobile dates')
header.write_text(h)


test = Path('tests/journal-validation-mobile-v4.e2e.mjs')
t = test.read_text()

t = replace_once(
    t,
    """  const target = page.locator('#archiveList > .archive-item').nth(10);\n  await target.scrollIntoViewIfNeeded();\n  await target.locator('.archive-actions button').first().click();\n  await target.locator('.lj-review.open').waitFor();""",
    """  const target = page.locator('#archiveList > .archive-item').nth(10);\n  await target.scrollIntoViewIfNeeded();\n  const openBefore = await target.evaluate(() => {\n    const modal = document.querySelector('#archiveOverlay .archive-modal');\n    return modal?.scrollTop || 0;\n  });\n  const reviewButton = target.locator('.archive-actions button').first();\n  assert.equal(await reviewButton.getAttribute('type'), 'button', 'review button must never submit/navigate');\n  await reviewButton.click();\n  await target.locator('.lj-review.open').waitFor();\n  await page.waitForTimeout(90);\n  const openAfter = await target.evaluate(() => {\n    const modal = document.querySelector('#archiveOverlay .archive-modal');\n    return modal?.scrollTop || 0;\n  });\n  assert.ok(Math.abs(openAfter - openBefore) <= 2, `opening validation moved archive-modal scroll (${openBefore} -> ${openAfter})`);""",
    'review-open scroll test'
)


t = replace_once(
    t,
    """      widths:inputRects.map(rect => rect.width),\n      rightEdges:inputRects.map(rect => rect.right),""",
    """      widths:inputRects.map(rect => rect.width),\n      heights:inputRects.map(rect => rect.height),\n      textAligns:inputs.map(el => getComputedStyle(el).textAlign),\n      rightEdges:inputRects.map(rect => rect.right),""",
    'date layout metrics'
)


t = replace_once(
    t,
    """  assert.ok(dateLayout.widths.every(width => width <= 160.5), `date controls are still too wide: ${JSON.stringify(dateLayout.widths)}`);\n  assert.ok(dateLayout.rightEdges.every(right => right <= dateLayout.cardRight + 1), 'date controls overflow their journal card');""",
    """  assert.ok(Math.abs(dateLayout.widths[0] - dateLayout.widths[1]) <= 2, `date controls must use equal columns: ${JSON.stringify(dateLayout.widths)}`);\n  assert.ok(dateLayout.heights.every(height => height <= 40.5), `date controls are still too tall: ${JSON.stringify(dateLayout.heights)}`);\n  assert.ok(dateLayout.textAligns.every(value => value === 'center'), `date values must be centered: ${JSON.stringify(dateLayout.textAligns)}`);\n  assert.ok(dateLayout.rightEdges.every(right => right <= dateLayout.cardRight + 1), 'date controls overflow their journal card');""",
    'date compact center assertions'
)

test.write_text(t)

print('journal validation mobile V5 patch applied')
