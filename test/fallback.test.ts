
import Tap from 'tap'

import {LocaleStrings, getSystemLocale} from "../src/i18n";
import NodeFileOps from "../src/NodeFileOps";

let i18n
i18n = new LocaleStrings()
i18n.init(NodeFileOps)
i18n.loadForLocale(getSystemLocale())

function fallbackTest() {
    Tap.test('Fallback', t => {
        let r = ''+i18n.isLocaleLoaded('en-US')
        let x = 'true'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        r = i18n.getLocaleString('test.greeting')
        x = 'howdy dude'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        i18n.loadForLocale('en-XX')
        i18n.setLocale('en-XX')

        r = i18n.getLocaleString('test.greeting')
        x = 'hello'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        // now switch to french
        i18n.loadForLocale('fr-FR')
        i18n.setLocale('fr-FR')

        r = i18n.getLocaleString('test.greeting')
        x = 'bonjour'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        i18n.loadForLocale('fr-CA')
        i18n.setLocale('fr-CA')
        r = i18n.getLocaleString('test.greeting')
        x = 'bonjour eh?'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        i18n.loadForLocale('en-GB')
        i18n.setLocale('en-GB')
        r = i18n.getLocaleString('test.greeting')
        x = 'hello, bloke'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        t.end()
    })
}

fallbackTest()

