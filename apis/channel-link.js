
module.exports = function (sbot) {
  return function (channel) {
    return ['a', {href: '/public?channel='+encodeURIComponent(channel)}, '#'+channel]
  }
}
