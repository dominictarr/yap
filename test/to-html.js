
var pull = require('pull-stream')
var u = require('../util')

var h = u.h
var toHTML = u.toHTML

var hs = h('h1', function (cb) {
  setTimeout(function () {
    cb(null, 'hello world')
  })
},
  h('ol',
    pull.values([
      h('li', 'one'),
      h('li', 'two'),
      h('li', 'three'),
    ])
  )
)

console.error(hs)

toHTML(hs)(function (err, el) {
  if(err) throw err
  console.log(el.outerHTML)
})



