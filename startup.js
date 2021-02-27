const forever = require('forever-monitor')

const child = new (forever.Monitor)('server.js', {
  silent: false
})

child.on('exit', function () {
  console.log('server.js has exited after 3 restarts')
})

child.start()
