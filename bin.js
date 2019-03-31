const fs = require('fs'),
      path = require('path'),
      ssbKeys = require('ssb-keys'),
      stringify = require('pull-stringify'),
      open = require('opn'),
      home = require('os-homedir')(),
      nonPrivate = require('non-private-ip'),
      muxrpcli = require('muxrpcli')

const SEC = 1e3
const MIN = 60*SEC

const network = 'ssb'
//const network = 'decent'
//const network = 'testnet'

let config = require('./config/inject')(network)

config.keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))

const mvdClient = fs.readFileSync(path.join('./build/index.html'))

const manifestFile = path.join(config.path, 'manifest.json')

let argv = process.argv.slice(2)
const i = argv.indexOf('--')
const conf = argv.slice(i+1)
argv = ~i ? argv.slice(0, i) : argv

if (argv[0] === 'server') {
  const createSbot = require('scuttlebot-release/node_modules/scuttlebot')
    .use(require('scuttlebot-release/node_modules/scuttlebot/plugins/master'))
    .use(require('scuttlebot-release/node_modules/scuttlebot/plugins/gossip'))
    .use(require('scuttlebot-release/node_modules/scuttlebot/plugins/replicate'))
    .use(require('ssb-friends'))
    .use(require('ssb-blobs'))
    .use(require('ssb-backlinks'))
    .use(require('./query'))
    .use(require('ssb-links'))
    .use(require('ssb-ebt'))
    .use(require('ssb-search'))
    .use(require('scuttlebot-release/node_modules/scuttlebot/plugins/invite'))
    .use(require('scuttlebot-release/node_modules/scuttlebot/plugins/local'))
    .use(require('decent-ws'))
    .use({
      name: 'serve',
      version: '1.0.0',
      init: function (sbot) {
        sbot.ws.use(function (req, res, next) {
          const send = config
          delete send.keys // very important to keep this, as it removes the server keys from the config before broadcast
          send.address = sbot.ws.getAddress()
          sbot.invite.create({modern: true}, function (err, cb) {
            send.invite = cb
          })
          if (req.url === '/')
            res.end(mvdClient)
          else if (req.url === '/get-config')
            res.end(JSON.stringify(send))
          else next()
        })
      }
    })
  
  open('http://localhost:' + config.ws.port, {wait: false})
  
  const server = createSbot(config)
  
  fs.writeFileSync(manifestFile, JSON.stringify(server.getManifest(), null, 2))
} else {

  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(manifestFile))
  } catch (err) {
    throw explain(err,
      'no manifest file'
      + '- should be generated first time server is run'
    )
  }

  // connect
  require('ssb-client')(config.keys, {
    manifest: manifest,
    port: config.port,
    host: config.host||'localhost',
    caps: config.caps,
    key: config.key || config.keys.id
  }, function (err, rpc) {
    if (err) {
      if (/could not connect/.test(err.message)) {
        console.log('Error: Could not connect to the scuttlebot server.')
        console.log('Use the "server" command to start it.')
        if (config.verbose) throw err
        process.exit(1)
      }
      throw err
    }

    // add some extra commands
    manifest.version = 'async'
    manifest.config = 'sync'
    rpc.version = function (cb) {
      console.log(require('./package.json').version)
      cb()
    }
    rpc.config = function (cb) {
      console.log(JSON.stringify(config, null, 2))
      cb()
    }

    // run commandline flow
    muxrpcli(argv, manifest, rpc, config.verbose)
  })
}
