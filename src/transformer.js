/* eslint-disable no-case-declarations,one-var */
'use strict';

const getArrayElements = elements => {
    const arr = [];

    if (!elements.length) {
        return arr;
    }

    arr.push(transformer.getNodeValue(elements[0]));

    return arr.concat(getArrayElements(elements.slice(1)));
};

const getParams = params =>
    params.map(arg => transformer.getNodeValue(arg)).join(',');

const getParamsWrapped = params =>
    [
        '(',
        getParams(params),
        ')'
    ].join('');

const makeForExpression = (node, type) =>
    // Return a joined array instead of just a template string for
    // better control over formatting.
    [
        `for (${transformer.getNodeValue(node.left)} ${type} ${transformer.getNodeValue(node.right)}) {`,
        transformer.getNodeValue(node.body),
        '}'
    ].join('');

const get = ctx => {
    const node = ctx.node,
        nodeType = node.type;

    let value;

    switch (nodeType) {
        case 'ArrayExpression':
            value = [
                '[',
                getArrayElements(node.elements).join(', '),
                ']'
            ].join('');
            break;

        case 'ArrowFunctionExpression':
            const isBlockStatement = node.body.type === 'BlockStatement';

            value = [
                getParamsWrapped(node.params),
                ' => ',
                isBlockStatement ? '{' : '',
                transformer.getNodeValue(node.body),
                isBlockStatement ? '}' : ''
            ].join('');
            break;

        case 'AssignmentExpression':
        case 'BinaryExpression':
        case 'LogicalExpression':
            value = [
                transformer.getNodeValue(node.left),
                node.operator,
                transformer.getNodeValue(node.right)
            ].join(' ');
            break;

        case 'BlockStatement':
            value = node.body.map(node => `${transformer.getNodeValue(node)} ;`).join('');
            break;

        case 'CallExpression':
        case 'NewExpression':
            value = `${transformer.getNodeValue(node.callee)} (${getParams(node.arguments)})`;

            if (nodeType === 'NewExpression') {
                value = `new ${value}`;
            }
            break;

        case 'ConditionalExpression':
            value = [
                '(',
                transformer.getNodeValue(node.test),
                ' ? ',
                transformer.getNodeValue(node.consequent),
                ' : ',
                transformer.getNodeValue(node.alternate),
                ')'
            ].join('');
            break;

        case 'ExpressionStatement':
            value = transformer.getNodeValue(node.expression);
            break;

        case 'ForInStatement':
            value = makeForExpression(node, 'in');
            break;

        case 'ForOfStatement':
            value = makeForExpression(node, 'of');
            break;

        case 'ForStatement':
            // Return a joined array instead of just a template string for better control over formatting.
            value = [
                `for (${transformer.getNodeValue(node.init)}; ${transformer.getNodeValue(node.test)}; ${transformer.getNodeValue(node.update)}) {`,
                transformer.getNodeValue(node.body),
                '}'
            ].join('');
            break;

        case 'FunctionDeclaration':
        case 'FunctionExpression':
            const isFunctionDeclaration = node.type === 'FunctionDeclaration';

            value = [
                'function ',
                // TODO: Is ternary necessary?
                isFunctionDeclaration ?
                    transformer.getNodeValue(node.id) :
                    getParamsWrapped(node.params),
                ' {',
                transformer.getNodeValue(node.body),
                '}'
            ].join('');
            break;

        case 'Identifier':
            value = node.name;
            break;

        case 'IfStatement':
            value = [
                'if (',
                transformer.getNodeValue(node.test),
                ') {',
                transformer.getNodeValue(node.consequent),
                node.alternate ?
                    `} else ${transformer.getNodeValue(node.alternate)}` :
                    '}'
            ].join('');
            break;

        case 'Literal':
            value = node.raw;
            break;

        case 'MemberExpression':
            const nestedObj = node.object;

            // TODO
//                while (nestedObj) {
                  // TODO: Clean up.
                  value = `${transformer.getNodeValue(nestedObj)}${(node.computed ? '[' : '.')}${transformer.getNodeValue(node.property)}${(node.computed ? ']' : '')}`;
//                }
            break;

        case 'ObjectExpression':
            const props = node.properties;

            value = !props.length ?
                '{}' :
                [
                    '{',
                    props.map(prop => {
                        return `${transformer.getNodeValue(prop.key)}: ${transformer.getNodeValue(prop.value)}`;
                    }),
                    '}'
                ].join('');
            break;

        case 'ReturnStatement':
            value = `return ${transformer.getNodeValue(node.argument)}`;
            break;

        case 'SequenceExpression':
            const expressions = node.expressions,
                res = [];

            if (!expressions.length) {
                return res;
            }

            res.push(transformer.getNodeValue(expressions[0]));

            value = res.concat(transformer.getNodeValue(expressions.slice(1)));
            break;

        case 'TemplateLiteral':
            // TODO
            value = '`TODO: parse template strings`';
            break;

        case 'ThisExpression':
            value = 'this';
            break;

        case 'UnaryExpression':
        case 'UpdateExpression':
            const arg = node.argument;

            while (arg) {
                return (node.prefix) ?
                    `${node.operator} ${transformer.getNodeValue(arg)}` :
                    `${transformer.getNodeValue(arg)} ${node.operator}`;
            }

            value = node.name;
            break;

        case 'VariableDeclaration':
            const declarations = node.declarations.reduce((acc, curr) => {
                const init = curr.init;
                let tpl = `${transformer.getNodeValue(curr.id)}`;

                if (init) {
                    tpl += ` = ${transformer.getNodeValue(init)}`;
                }

                acc.push(tpl);

                return acc;
            }, []).join(', ');

            value = `${node.kind} ${declarations}`;
            break;

        case 'VariableDeclarator':
            value = `${transformer.getNodeValue(node.id)} = ${transformer.getNodeValue(node.init)};`;
            break;

        case 'WhileStatement':
            // Return a joined array instead of just a template string for
            // better control over formatting.
            value = [
                'while (',
                transformer.getNodeValue(node.test),
                ') {',
                transformer.getNodeValue(node.body),
                '}'
            ].join('');
            break;
    }

    return value;
};

const transformer = {
    getNodeValue: ctx => {
        return get(transformer.map(ctx));
    },

    // This would override the base transformer's implementation that could
    // simply be an identityFn.
    map: ctx => {
        // Can accept a custom context, for example:
        //
        //      ctx = {
        //          node: node,             <--- the wrapped AST node
        //          type: 'TooManyReturns'  <--- our custom node type
        //      };
        //
        // or a plain AST node so we need to be able to handle both cases.
        return {
            node: ctx.node || ctx,
            type: ctx.type
        };
    }
};

module.exports = transformer;

