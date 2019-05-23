var u = require('yap-util')
module.exports = u.createRenderer(function (data) {
  return ['pre', JSON.stringify(data, null, 2)]
})






