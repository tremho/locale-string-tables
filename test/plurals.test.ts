
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
        let tests = ['cow', 'sheep', 'potato', 'octopus', 'miss', 'box', 'ox', 'tomato']
        let expects = ['Cows', 'Sheep', 'Potatoes', 'Octopi', 'misses', 'boxes', 'oxen', 'tomatoes'] // capitalized ones are in the table that way on purpose
        for(let i=0; i<tests.length; i++) {
            let id = tests[i]
            r = i18n.getPluralizedString('', id,12)
            x = expects[i]
            t.ok(r === x, `lookup: expected "${x}", got "${r}"`)
        }
        r = i18n.getPluralizedString('','missing', 5)
        x = '%$$>missing<$$%'
        r = i18n.getPluralizedString('','test.greeting', 5)
        x = 'howdy dudes'
        t.ok(r === x, `lookup: expected "${x}", got "${r}"`)

        // same test, but without lookup
        for(let i=0; i<tests.length; i++) {
            let id = tests[i]
            if(id !== 'sheep' && id !=='octopus' && id !== 'ox') { // these words need to be in table
                r = i18n.pluralize('', id, 12)
                x = expects[i].toLowerCase()
                t.ok(r === x, `raw pluralization: expected "${x}", got "${r}"`)
            }
        }
        // ordinal test
        const expectsOrd = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth",
            "tenth","eleventh","twelfth","thirteenth","fourteenth","fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth",
            "20th", "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th"
        ]

        for(let i=0; i<30; i++) {
            let id = tests[i]
            r = i18n.pluralize('', 'item', i, 'ordinal')
            x = expectsOrd[i] + ' item'
            t.ok(r === x, `expected "${x}", got "${r}"`)
        }
        r = i18n.getPluralizedString('', 'cow', 12, 'ordinal')
        x = 'twelfth Cow' // cap is per table
        t.ok(r === x, `ordinal: expected "${x}", got "${r}"`)

        // test of mismatched parameters: forgot to  pass locale as first parameter
        try {
            r = i18n.getPluralizedString('foo.bar', 42)
        } catch(e) {
            r = e.message
        }
        // x = 'Invalid language tag: foo.bar'
        x = 'Incorrect locale information provided'
        t.ok(r === x, 'no locale passed returns '+r)

        t.end()
        return

        let count = 1
        r = i18n.getPluralizedString('es','cow', count)
        x = 'Cow'
        t.ok(r === x, `singular: expected "${x}", got "${r}"`)


        t.end()


    })
}

pluralsTest()
