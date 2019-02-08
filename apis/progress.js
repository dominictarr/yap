var u = require('../util')

function round (n, p) {
  return Math.round(n * p) / p
}

function percent (n) {
  return (round(n, 1000)*100).toString().substring(0, 4)+'%'
}

function rate (prog) {
  if(prog.target == prog.current) return 1
  return (prog.current - prog.start) / (prog.target - prog.start)
}

module.exports = function (sbot) {
  return function () {
    return function (cb) {
      sbot.progress(function (err, prog) {
        var s = '', r = 1
        for(var k in prog)
          if(prog[k].current <= prog[k].target) {
            var _r = rate(prog[k])
            r = Math.min(r, _r)
            s += (s ? ', ' : '') + k +': ' + percent(r)
          }
        cb(null, ['progress', {value: r, max: 1, title: s}, 
          u.cacheTag('/progress', 'prog', Date.now() + 1000)
        ])
      })
    }
  }
}


