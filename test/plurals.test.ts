
// TODO: Exercise plurals testing



import Tap from 'tap'

import {LocaleStrings, getSystemLocale} from "../src/i18n";
import NodeFileOps from "../src/NodeFileOps";

let i18n
i18n = new LocaleStrings()
i18n.init(NodeFileOps)
i18n.loadForLocale(getSystemLocale())

function pluralsTest() {
    Tap.test('Plurals', t => {
        let r = ''
        let x = ''
        let tests = ['cow', 'sheep', 'potato', 'octopus']
        let expects = ['Cows', 'Sheep', 'Potatoes', 'Octopi']
        for(let i=0; i<tests.length; i++) {
            let id = tests[i]
            r = i18n.getPluralizedString(id,12)
            x = expects[i]
            t.ok(r === x, `expected "${x}", got "${r}"`)
        }
        r = i18n.getPluralizedString('missing', 5)
        x = '%$$>missing<$$%'
        r = i18n.getPluralizedString()
        r = i18n.getPluralizedString('test.greeting', 5)
        x = 'howdy dudes'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        t.end()


    })
}

pluralsTest()
