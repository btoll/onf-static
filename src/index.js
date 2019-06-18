'use strict';

const esprima = require('esprima');
const fs = require('fs');
const logger = require('onf-logger');
const defaultVisitor = require('./visitor');
const htmlGenerator = require('./generator/html.js');
const logGenerator = require('./generator/log.js');
//const markdownGenerator = require('./generator/markdown.js');

let defaultOptions = {
    debug: false,
    destination: '.',
    filename: `cli_${+(new Date())}`, // Unix timestamp.
    generator: {
        html: htmlGenerator,
        log: logGenerator,
//        markdown: markdownGenerator
    },
    type: 'log',
    useMap: false,
    verbose: 0,
    visitor: null
};

const lineSeparator = '----------------------';

const getFile = (filename, isData = false) =>
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

    return getFile(filename, isData)
    .then(suite => {
        let nodes;

        logger.debug(lineSeparator);
        logger.debug('Creating AST and capturing nodes');
        logger.debug(lineSeparator);

        try {
            nodes = visitTree(suite);
        } catch (err) {
            const errMsg = 'Invalid JavaScript';

            logger.fatal(errMsg);
            throw new Error(err);
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
                logger.debug('Printing nodes'),
                generator.print(nodes, Object.assign(getOptions(), { filename }))
            );
    });
};

const setDebugLevel = s =>
    logger.setLogLevel(s);

const getGenerator = () => {
    const opts = getOptions();
    return opts.generator[opts.type];
};

const getOptions = () =>
    defaultOptions

const setOptions = (options = {}) =>
    defaultOptions = Object.assign(defaultOptions, options);

const getVisitor = () => {
    logger.debug(lineSeparator);

    let visitor = getOptions().visitor;

    if (!visitor) {
        logger.debug('** Registering default visitor type **');
        return defaultVisitor;
    } else {
        logger.debug('** Registering custom visitor type **');

        for (const type of Object.keys(visitor)) {
            visitor = Object.assign(defaultVisitor, visitor);
            logger.debug('Registering type ->', type);
        }

        logger.debug(lineSeparator);

        return visitor;
    }
};

const visitTree = suite => {
    const container = getOptions().useMap ?
        new Map() :
        [];

    return getVisitor().visit(esprima.parse(suite, {
        // Ariya says having this set to `module` is best practice!
        sourceType: 'module',
        comment: true,
        loc: true
    }), null, container);
};

module.exports = {
    makeTree,
    getOptions,
    setOptions,
    setDebugLevel
};

