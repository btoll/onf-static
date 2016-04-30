'use strict';

const esprima = require('esprima');
const fs = require('fs');
const logger = require('logger');
const visitor = require('./visitor');
const lineSeparator = '----------------------';

function getSuite(file, isData) {
    return new Promise((resolve, reject) => {
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
}

function visitTree(suite) {
    return visitor.visit(esprima.parse(suite, {
        comment: true,
        loc: true
    }), null, []);
}

module.exports = {
    makeTree(file, generator, isData) {
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
            logger.debug(lineSeparator);
            logger.debug('Creating AST and capturing nodes');
            logger.debug(lineSeparator);

            const nodes = visitTree(suite);
            const len = nodes.length;

            logger.debug(lineSeparator);
            logger.debug(
                `Captured ${len} node${len !== 1 ? 's' : ''}`
            );
            logger.debug(lineSeparator);

            logger.debug(lineSeparator);
            return !len ?
                (logger.debug('Exiting without printing'), 'No results found') :
                (logger.debug('Printing'), generator.print(nodes, file));
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

