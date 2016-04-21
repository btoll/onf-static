'use strict';

const esprima = require('esprima');
const fs = require('fs');
let visitor = require('./visitor');

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

        return getSuite(file, isData)
        .then(suite => {
            const nodes = visitTree(suite);

            return !nodes.length ?
                'No results found' :
                generator.print(nodes);
        });
    },
    register(v) {
        for (const type of Object.keys(v)) {
            visitor[type] = v[type];
        }
    }
};

