var u = require('yap-util')
var ref = require('ssb-ref')
var niceAgo = require('nice-ago')
var toUrl = u.toUrl

module.exports = function (opts, apply) {
  return ['div.Message',
    apply.cacheAttrs(toUrl('message', {id: opts.key}), opts.key, apply.since),
    ['div.MessageSide',
      apply('avatar', {id: opts.author, name: false, image: true}),
      ['a', {
        href: toUrl('message', {id: opts.key}),
        title: new Date(opts.ts)+'\n'+opts.key
      },
        ''+niceAgo(Date.now(), opts.ts)
      ]
    ],
    ['div.MessageMain',
      ['div.MessageMeta',
        apply('avatar', {id: opts.author, name: true, image: false}),
        ['label.msgId', opts.id],
        opts.meta ? opts.meta : ''
      ],
      ['div.MessageContent', opts.content],
//      opts.extra && ['div.MessageExtra', apply('messageExtra', opts.key)]
    ]
  ]
}
