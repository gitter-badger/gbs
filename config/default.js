'use strict'

/**
 * This module contains the default config for the gitbook site.
 * @module config
 * @type {Object}
 */
module.exports = {
  /**
   * The name of your book/site.
   * It will be used to look for the configuration file and set the app title in express.
   * @type {String}
   */
  gitbookSiteName: process.env.BOOK_NAME || 'Book',
  /**
   * The path where are stored the pdf artifacts.
   * It defaults to `false`.
   * @type {String|Boolean}
   */
  'pdf-path': false,
  /**
   * The path of the static assets of the book/site.
   * Here will be the gitbook generated files, the `book.json` file and any static assets
   * It defaults to the `public` folder in the working directory.
   * @type {String}
   */
  'public-path': './public',
  /**
   * The path where the views are kept.
   * It defaults to the `views` folder in the working directory.
   * @type {String}
   */
  'views-path': './views',
  /**
   * The view engine used.
   * It defaults to `pug`.
   * @type {String}
   */
  'view-engine': 'pug',
  /**
   * Useful if the site is behind a proxy.
   * It defaults to `/`.
   * If changed, it will change all the root url of static assets (javascript, css etc..) in the views
   * and the root url of the site endpoints.
   * @type {String}
   */
  'root-url': '/',
  /**
   * Whether to server favicon.
   * It defaults to false. To enable it put the path of the favicon.
   * @type {String|Boolean}
   */
  favicon: false,
  /**
   * Whether if locales are enabled.
   * It defaults to `false`.
   * To enable it specify an array of locales codes (it, en etc...)
   * @type {String|Boolean}
   */
  locales: false,
  /**
   * The path where the translations are stored.
   * @see https://github.com/mashpie/i18n-node
   * @type {String}
   */
  'locales-path': './locales',
  /**
   * App environment.
   * It defaults to `development`.
   * @type {String}
   */
  env: process.env.NODE_ENV || 'development',
  /**
   * Listening port.
   * It defaults to `8080`.
   * @type {Number|String}
   */
  port: process.env.PORT || 8080,
  /**
   * App logger configuration.
   * @type {Object}
   */
  logger: {
    /**
     * Log level
     * @see https://github.com/winstonjs/winston#logging-levels
     * @type {String}
     */
    level: (process.env.NODE_ENV || 'development') === 'development' ? 'debug' : 'info',
    /**
     * A list of logging transports
     * @type {Array<Object>}
     * @see https://github.com/winstonjs/winston/blob/master/docs/transports.md
     */
    transports: []
  }
}
