module.exports = function (opts, content, apply, req) {
  var tr = require('./translations')(req.cookies.lang)
  return ['html',
    ['head', {profile: "http://www.w3.org/2005/10/profile"},
      ['meta', {charset: 'UTF-8'}],
      ['link', {href: '/static/style.css', rel: 'stylesheet'}],
      ['script', {src: apply.scriptUrl}],
      ['link', {rel: 'icon', type: 'image/png', href: '/favicon.ico'}],
    ],
    ['body',
      ['div#AppHeader',
        ['nav',
          ['div', {style: 'display:flex;flex-direction:row'},
            ['h2', tr('AppName')],
            ['img', {src: '/favicon.ico'}]
          ],
          ['a', {href: '/public'}, tr('Public')],
          ['a', {href: '/private'}, tr('Private')],
//          ['a', {href: '/gatherings'}, 'Gatherings'],
          ['form', {method: 'GET', action: '/search'},
            ['input', {type: 'text', name: 'query', placeholder: tr('Search')}],
            ['input', {type: 'hidden', name: 'limit', value: 20}],
            ['button', {}, tr('Go')]
          ],
          apply('identitySelect', {main: true})
        ],
        apply('progress', {})
      ],
      ['div.main', content]
    ]
  ]
}
