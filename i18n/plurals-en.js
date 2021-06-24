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
   * @return {string|*}
   */
  findPlural (single, count, /* type = 'cardinal'*/) {
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
  }
}
