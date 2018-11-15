

module.exports = function (opts) {
  return this.api('public', Object.assign({}, opts, {private: true}))
}
