
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

        i18n.loadForLocale(r)
        r = ''+i18n.isLocaleLoaded('en-US')
        x = 'true'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        r = i18n.getLocaleString('test.common')
        x = 'test common'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        r = i18n.getLocaleString('test.country')
        x = 'US'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        t.end()
    })
}

initTest()

