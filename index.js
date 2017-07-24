'use strict'

const express = require('express')
const favicon = require('serve-favicon')
const Conphy = require('conphy').Conphy
const winston = require('winston')
const expressWinston = require('express-winston')
const Memchecker = require('node-memchecker')
const shortid = require('shortid')
const isObject = require('isobject')
const helmet = require('helmet')
const glob = require('glob')
const path = require('path')
const fs = require('fs')
const JSONStream = require('JSONStream')
const i18n = require('i18n')

const defaults = {
  gitbookSiteName: process.env.BOOK_NAME || 'Book',
  'pdf-path': './pdf',
  'public-path': './public',
  'views-path': './views',
  'view-engine': 'pug',
  'root-url': '/',
  favicon: false,
  locales: ['en', 'it'],
  'locales-path': './locales',
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  logger: {
    level: (process.env.NODE_ENV || 'development') === 'development' ? 'debug' : 'info',
    transports: []
  }
}

class GitbookSite {
  constructor (options) {
    this._conphy = new Conphy({
      app: {
        name: defaults.gitbookSiteName,
        defaults: Object.assign({}, defaults, options)
      }
    })
    Object.defineProperty(this, '_id', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: shortid.generate()
    })
    Object.defineProperty(this, 'name', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: defaults.gitbookSiteName
    })
  }
  _initExpress (options) {
    Object.defineProperty(this, 'port', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: options.port
    })
    Object.defineProperty(this, '_rootUrl', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: options['root-url']
    })
    console.log(options)
    this._app = express()
    this._app.locals.title = this.name
    this._app.set('env', options.env)
    options.locales && i18n.configure({
      queryParameter: 'lang',
      locales: options.locales,
      directory: path.resolve(options['locales-path'])
    })
    options['view-engine'] && this._app.set('views', path.resolve(options['views-path']))
    options['view-engine'] && this._app.set('view engine', options['view-engine'])
    options['trust-proxy'] && this._app.set('trust proxy', options['trust-proxy'])
    this._app._pdfPath = options['pdf-path']
    this._app._publicPath = options['public-path']
    options.locales && (this._app.localesPath = options['locales-path'])
    options.favicon && this._app.use(favicon(path.resolve(options.favicon)))
    options.locales && this._app.use(i18n.init)
    this._app.use(helmet())
    this._app.use(express.static(path.resolve(this._app._publicPath)))
    this._app.use(expressWinston.logger(options))

    this._app.get('/', (req, res, next) => {
      let self = this
      function _getBookJson (cb) {
        let content
        fs.createReadStream(path.join(self._app._publicPath, 'book.json'))
        .pipe(JSONStream.parse())
        .on('error', err => cb(err))
        .on('data', (data) => {
          content = data
        })
        .on('end', () => {
          return cb(null, content)
        })
      }

      function _parseBookInfo (data) {
        let info = {}
        info.versions = data.pluginsConfig.versions.options
        return info
      }

      _getBookJson((err, data) => {
        if (err) return next(err)
        res.format({
          html: function () {
            res.render('index', {
              rootUrl: self._rootUrl,
              bookJson: data
            })
          },
          json: function () {
            let info = _parseBookInfo(data)
            res.json({ bookJson: info })
          },
          default: function () {
            let info = _parseBookInfo(data)
            res.type('txt').send(JSON.stringify({ bookJson: info }, null, '\t'))
          }
        })
      })
    })

    this._app.get('/pdf/:release/:lang', (req, res, next) => {
      let options = {
        cwd: this._app._pdfPath,
        absolute: true
      }
      let expression = `**/${req.params.release}/*${req.params.lang}.pdf`

      glob(expression, options, (err, files) => {
        if (err) return next(err)
        if (!files.length) return next()
        res.download(files[0])
      })
    })

    this._app.use(expressWinston.errorLogger(options))

    /** catch 404 and forward to error handler */
    this._app.use(function (req, res, next) {
      var err = new Error('Not Found')
      err.status = 404
      next(err)
    })

    /** error handler */
    this._app.use((err, req, res, next) => {
      let status = err.status || 500
      let self = this
      res.status(status)
      res.format({
        html: function () {
          switch (status) {
            case 404:
              res.render('404', {
                rootUrl: self._rootUrl,
                error: {
                  status: status,
                  message: err.message,
                  error: req.app.get('env') === 'development' ? err : {}
                }
              })
              break
            default:
              res.render('500', {
                rootUrl: self._rootUrl,
                error: {
                  status: status,
                  message: err.message,
                  error: req.app.get('env') === 'development' ? err : {}
                }
              })
          }
        },
        json: function () {
          res.json({
            error: {
              status: status,
              message: err.message,
              error: req.app.get('env') === 'development' ? err : {}
            }
          })
        },
        default: function () {
          res.type('txt').send(err.message)
        }
      })
    })
    return this
  }
  _initLogger (options) {
    this._logger = new winston.Logger()
    options.logger.transports.unshift({
      type: 'Console',
      options: {
        name: `${this.name}-console`,
        timestamp: true,
        colorize: true,
        level: options.logger.level
      }
    })
    options.logger.transports.forEach((t) => {
      this._logger.add(winston.transports[t.type], t.options)
    })
    return this
  }
  _initMemechecker (options) {
    if (isObject(options.memDebug) || !!options.memDebug === true) {
      this._mc = Memchecker.create()
      this._mc.start().on('process-stats', (stats) => {
        this._logger.log('debug', `${this.name} | _id ${this._id} ${process.pid} : process-stats `, stats)
      }).on('gc-stats', (stats) => {
        this._logger.log('debug', `${this.name} | _id ${this._id} ${process.pid} : gc-stats `, stats)
      })
    }
    return this
  }
  start () {
    return new Promise((resolve, reject) => {
      if (this._started) return resolve()
      this._starting = true
      this._conphy.get().then((options) => {
        this._initLogger(options)
            ._initMemechecker(options)
            ._initExpress(Object.assign({}, options, {
              winstonInstance: this._logger,
              msg: `${this.name} | _id ${this._id} ${process.pid} : HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms`
            }))
        this._server = this._app.listen(this.port, () => {
          this._logger.log('info', `${this.name} | _id ${this._id} pid ${process.pid} : started on port ${this.port}`)
          resolve()
        })
      }).catch(reject)
    })
  }
  stop () {
    let self = this
    this._logger.log('warn', `${this.name} | _id ${this._id} pid ${process.pid} : received stop command`)
    if (!this._stopping) {
      this._stopping = true
      this._mc && this._mc.stop()
      this._server.once('close', function onClose () {
        self._logger.log('warn', `${self.name} | _id ${self._id} pid ${process.pid} : exiting now.`)
        process.exit()
      })
      this._server.close()
    }
  }
}

exports.GitbookSite = GitbookSite
exports.create = function (options) {
  return new GitbookSite(options)
}
