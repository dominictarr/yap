
module.exports = function (channel) {
  return ['a', {href: '/public?channel='+encodeURIComponent(channel)}, '#'+channel]
}
