'use strict';

const fs = require('fs');
const jsBeautify = require('js-beautify').js_beautify;
const path = require('path');
const transformer = require('../transformer');

module.exports = {
    makeTpl: (fileame, results) =>
        `<!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <style>
            * {
                margin: 0;
                padding: 0;
            }

            div {
                background: #207ab2;
                color: #eab560;
                font-family: monospace;
                margin: 0 40px;
                padding: 10px 10px 10px 50px;
            }

            div span {
                display: block;
                padding-left: 40px;
            }

            p.lines {
                background: #ddd;
                border: 1px solid #000;
                margin: 10px;
                padding: 10px;
            }

            p.lines span {
                font-weight: bold;
            }
            </style>
            </head>

            <body>
                <h3>Functional pattern analysis of file ${fileame}</h3>
                ${results}
            </body>
            </html>
        `,

    print: function (results, options) {
        return new Promise((resolve, reject) => {
            const rows = [];

            for (const entry of results) {
                const loc = entry.node.loc;
                const desc = entry.desc;

                rows.push([
                    `<p class="lines">Type <span>${entry.type}</span>, Lines ${loc.start.line} - ${loc.end.line}</p>`,
                    desc ? `<p class="lines"><span>${desc}</span></p>` : '',
                    `<div>
                        <p><pre>${jsBeautify(transformer.getNodeValue(entry))}</pre></p>
                    </div>`
                ].join('\n'));
            }

            fs.writeFile(`${options.destination}/${path.basename(options.filename)}_suite.html`, this.makeTpl(options.filename, rows.join('')), 'utf8', err => {
                if (err) {
                    reject('Oh no, something went wrong!');
                } else {
                    resolve(`Functional pattern analysis of ${options.filename} completed successfully.`);
                }
            });
        });
    }
};

