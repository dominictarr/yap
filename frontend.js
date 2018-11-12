var morph = require('morphdom')

var cached = {}
var start = Date.now(), _focus = Date.now()
function scan () {
  ;[].forEach.call(document.querySelectorAll('link[data-cache]'), function (el) {
    cached[el.id] = +el.dataset.cache
  })
}

window.onload = function () {
  var start2 = Date.now()
  scan()
}

window.onfocus = function () {
  _focus = Date.now()
  check(1)
}

function check () {
  var xhr = new XMLHttpRequest()
  xhr.onload = function () {
    if(xhr.responseText)
      var updates = JSON.parse(xhr.responseText)
    //mark any nodes that look like they need updating.
    var elements = [], parents = []
    for(var k in updates)
      [].forEach.call(document.querySelectorAll('#'+k), function (el) {
        parents.push(el.parentNode)
        elements.push(el)
      })
      elements = elements.filter(function (e) {
        e = e.parentNode
        while(e)
          if(~parents.indexOf(e.parentNode)) return false
          else e = e.parentNode
        return true
      }).forEach(function (el) {
        el.parentNode.classList.add('invalid')
        update(el)
      })
    //rebuild list of what might need to update
    scan()
  }
  //if the server fails, we'll just try again later.
  xhr.onerror = function (ev) {
    console.error('warning:', ev)
  }
  xhr.open('POST', '/check-cache')
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.send(JSON.stringify(cached))
}

function update (el) {
  var href = el.href
  var xhr = new XMLHttpRequest()
  xhr.onload = function () {
    //update html
    morph(el.parentNode, xhr.responseText)
  }
  href = href.substring(location.origin.length)
  xhr.open('get', '/partial'+href)
  xhr.send()
}

