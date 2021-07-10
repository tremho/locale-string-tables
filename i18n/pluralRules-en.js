module.exports = {

  /**
   * For English, anything more than one is pluralized
   * Zero and negative numbers are also pluralized
   * @param count
   * @return {string}
   */
  getPluralRulesSelect (count, /* type = 'cardinal'*/) {
    if (count === 1) return 'one'
    return 'other' // or plural
  },
  /**
   * Automatic pluralization simply adds an 's' to the string,
   * unless the word ends in o,x, or s, in which case it adds an 'es'.
   * Words that do not conform to these rules (like 'sheep' and 'octopi')
   * will need to have .plural entries in the string tables.
   * @param single
   * @param count
   * @param [select] the result of `getPluralRulesSelect` (not used for this language)
   * @return {string|*}
   */
  findPlural (single, count, select = '') {
    if(count === 1) return single
    let lastChar = single.charAt(single.length - 1)
    switch (lastChar) {
      case 'o':
      case 'x':
      case 's':
        return single + 'es'
      default:
        return single + 's'
    }
  },

  /**
   * Simple ordinal numbering for English.
   * spelled out up to 20, then suffix decorated according to last digit.
   * output includes the word given as part of the resulting string (e.g. "sixth item")
   * @param word
   * @param count
   */
  makeOrdinal(word, count) {
    const ords = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth",
      "tenth","eleventh","twelfth","thirteenth","fourteenth","fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth"
    ]
    const lastDigs = ['th','st','nd','rd']
    let ord = ords[count] || ''+count+(lastDigs[count % 10] || 'th')
    return ord+ ' '+word
  }
}

