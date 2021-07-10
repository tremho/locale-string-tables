
import Tap from 'tap'

import {LocaleStrings, getSystemLocale} from "../src/i18n";
import NodeFileOps from "../src/NodeFileOps";

let i18n

function initTest() {
    Tap.test('Init', t => {
        i18n = new LocaleStrings()
        i18n.init(NodeFileOps)
        let r = getSystemLocale()
        let x = 'en-US'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        let stats = i18n.loadForLocale(r)
        t.ok(typeof stats === 'object' && typeof stats.totalStrings === 'number' && typeof stats.localeName === 'string', 'loadForLocale should return a stats object')
        // t.skip(`${r} loaded with stats ${JSON.stringify(stats)}`)
        r = ''+i18n.isLocaleLoaded('en-US')
        x = 'true'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        r = i18n.getLocaleString('test.common')
        x = 'test common'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        r = i18n.getLocaleString('test.country')
        x = 'US'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        stats = i18n.loadForLocale('fu-BR')
        t.ok(typeof stats === 'object' && typeof stats.totalStrings === 'number' && typeof stats.localeName === 'string', 'loadForLocale should return a stats object')
        t.ok(stats.languageFiles === 0, 'Expected no language files in bogus locale, got '+ stats.languageFiles)

        stats = i18n.loadForLocale('en-FB')
        t.ok(typeof stats === 'object' && typeof stats.totalStrings === 'number' && typeof stats.localeName === 'string', 'loadForLocale should return a stats object')
        t.ok(stats.languageFiles === 1, 'Expected 1 en file in bogus region, got '+ stats.languageFiles)
        t.ok(stats.regionFiles === 0, 'Expected no region files in bogus region, got '+ stats.regionFiles)

        stats = i18n.loadForLocale()
        t.ok(typeof stats === 'object' && typeof stats.totalStrings === 'number' && typeof stats.localeName === 'string', 'loadForLocale should return a stats object')
        let ok = true
        if(!stats.languageFiles  && !stats.regionFiles && !stats.commonRegionFiles) {
            ok = false
        }
        t.ok(ok, 'Expected to have loaded some files, got '+ JSON.stringify(stats))

        t.end()
    })
}

initTest()

