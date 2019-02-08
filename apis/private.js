

module.exports = function (sbot) {
  return function (opts, apply) {
    return apply('public', Object.assign({}, opts, {private: true}))
  }
}
