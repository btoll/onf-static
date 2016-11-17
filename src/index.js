'use strict';

const esprima = require('esprima');
const fs = require('fs');
const logger = require('logger');
const visitor = require('./visitor');
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

const visitTree = suite =>
    visitor.visit(esprima.parse(suite, {
        comment: true,
        loc: true,
        sourceType: 'module'
    }), null, []);

module.exports = {
    makeTree(file, generator, verbosity = 0, isData = false) {
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
                nodes = visitTree(suite);
            } catch (err) {
                const errMsg = 'Invalid JavaScript';

                logger.fatal(errMsg);
                throw new Error(errMsg);
            }

            const len = nodes.length;

            logger.debug(lineSeparator);
            logger.debug(
                `Captured ${len} node${len !== 1 ? 's' : ''}`
            );
            logger.debug(lineSeparator);

            logger.debug(lineSeparator);
            return !len ?
                (logger.debug('Exiting without printing'), 'No results found') :
                (logger.debug('Printing'), generator.print(nodes, verbosity));
        });
    },
    register(v) {
        logger.debug(lineSeparator);
        for (const type of Object.keys(v)) {
            visitor[type] = v[type];
            logger.debug('Registering type ->', type);
        }
        logger.debug(lineSeparator);
    }
};

