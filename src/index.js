'use strict';

const esprima = require('esprima');
const fs = require('fs');
const logger = require('onf-logger');
const visitor = require('./visitor');

const format = {
    html: require('./generator/html.js'),
    log: require('./generator/log.js'),
//    markdown: require('./generator/markdown.js')
};

let defaultOptions = {
    active: false,
    destination: '.',
    filename: +(new Date()), // Unix timestamp.
    format: 'log',
    inactive: false,
    useMap: false,
    debug: false,
    verbose: false
};

const lineSeparator = '----------------------';

const getSuite = (filename, isData = false) =>
    new Promise((resolve, reject) => {
        if (isData) {
            resolve(filename);
        } else {
            fs.readFile(filename, 'utf8', (err, fileContents) => {
                if (err) {
                    reject('There was a problem processing the file.');
                } else {
                    resolve(fileContents);
                }
            });
        }
    });

const makeTree = (filename, isData = false) => {
    if (!filename) {
        throw new Error('No file given');
    }

    const generator = getGenerator();

    if (!generator) {
        throw new Error('No generator given');
    }

    logger.debug(lineSeparator);
    logger.debug(`Reading from ${isData ? 'STDIN' : filename}`);
    logger.debug(lineSeparator);

    return getSuite(filename, isData)
    .then(suite => {
        let nodes;

        logger.debug(lineSeparator);
        logger.debug('Creating AST and capturing nodes');
        logger.debug(lineSeparator);

        try {
            nodes = visitTree(suite, defaultOptions);
        } catch (err) {
            const errMsg = 'Invalid JavaScript';

            logger.fatal(errMsg);
            throw new Error(errMsg);
        }

        // TODO: This is clunky.
        const len = !getOptions().useMap ?
            nodes.length :
            nodes.size;

        logger.debug(lineSeparator);
        logger.debug(`Captured ${len} node${len !== 1 ? 's' : ''}`);
        logger.debug(lineSeparator);
        logger.debug(lineSeparator);

        return !len ?
            (
                logger.debug('Exiting without printing'),
                'No results found'
            ) :
            (
                logger.debug('Printing'),
                generator.print(nodes, Object.assign(getOptions(), { filename }))
            );
    });
};

const setDebugLevel = s =>
    logger.setLogLevel(s);

const getFormat = () =>
    format;

const setFormat = fmt =>
    generator = fmt;

const getGenerator = () =>
    format[getOptions().format];

const setGenerator = (k, v) =>
    format[k] = v;

const getOptions = () =>
    defaultOptions

const setOptions = (options = {}) =>
    defaultOptions = Object.assign(defaultOptions, options);

const setVisitor = v => {
    logger.debug(lineSeparator);

    for (const type of Object.keys(v)) {
        visitor[type] = v[type];
        logger.debug('Registering type ->', type);
    }

    logger.debug(lineSeparator);
};

const visitTree = suite => {
    const container = defaultOptions.useMap ?
        new Map() :
        [];

    return visitor.visit(esprima.parse(suite, {
        // Ariya says having this set to `module` is best practice!
        sourceType: 'module',
        comment: true,
        loc: true
    }), null, container);
};

module.exports = {
    makeTree,
    setDebugLevel,
    setGenerator,
    setOptions,
    setVisitor
};

