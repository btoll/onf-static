'use strict';

const esprima = require('esprima');
const fs = require('fs');
const logger = require('logger');
const visitor = require('./visitor');

let defaultOptions = {
    active: false,
    inactive: false,
    useMap: false,
    verbose: false
};

const lineSeparator = '----------------------';

const getSuite = (file, isData = false) =>
    new Promise((resolve, reject) => {
        if (isData) {
            resolve(file);
        } else {
            fs.readFile(file, 'utf8', (err, fileContents) => {
                if (err) {
                    reject('There was a problem processing the file.');
                } else {
                    resolve(fileContents);
                }
            });
        }
    });

const makeTree = (file, generator, options, isData = false) => {
    if (!file) {
        throw new Error('No file given');
    }

    if (!generator) {
        throw new Error('No generator given');
    }

    logger.debug(lineSeparator);
    logger.debug(`Reading from ${isData ? 'STDIN' : file}`);
    logger.debug(lineSeparator);

    return getSuite(file, isData)
    .then(suite => {
        let nodes;

        logger.debug(lineSeparator);
        logger.debug('Creating AST and capturing nodes');
        logger.debug(lineSeparator);

        try {
            nodes = visitTree(suite, options = defaultOptions);
        } catch (err) {
            const errMsg = 'Invalid JavaScript';

            logger.fatal(errMsg);
            throw new Error(errMsg);
        }

        const len = nodes.length;

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
                generator.print(nodes, options || defaultOptions)
            );
    });
};

const register = v => {
    logger.debug(lineSeparator);

    for (const type of Object.keys(v)) {
        visitor[type] = v[type];
        logger.debug('Registering type ->', type);
    }

    logger.debug(lineSeparator);
};

const setOptions = options =>
    defaultOptions = options;

const visitTree = (suite, options) => {
    // TODO: Make better?
    visitor.options = options;

    const container = options.useMap ?
        new Map() :
        [];

    return visitor.visit(esprima.parse(suite, {
        // Having this set to `module` is best practice!
        sourceType: 'module',
        comment: true,
        loc: true
    }), null, container);
};

module.exports = {
    makeTree,
    register,
    setOptions
};

