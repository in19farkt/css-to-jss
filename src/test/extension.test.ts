//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { parseProperty, calcPropertyType, calcMaxType, IPropertyDetails } from '../extension';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

suite("parseProperty Tests", function () {
    test("Should correctly parse property", function () {
        assert.deepEqual(parseProperty('  margin: 12px;'), {
            spacing: '  ',
            name: 'margin',
            value: '12px',
            type: 'css',
        });
        assert.deepEqual(parseProperty('\tmargin: 12px;'), {
            spacing: '\t',
            name: 'margin',
            value: '12px',
            type: 'css',
        });
        assert.deepEqual(parseProperty('  margin: 12,'), {
            spacing: '  ',
            name: 'margin',
            value: '12',
            type: 'jss',
        });
        assert.deepEqual(parseProperty('  margin: \'12px\','), {
            spacing: '  ',
            name: 'margin',
            value: '12px',
            type: 'jss',
        });
        assert.deepEqual(parseProperty('\tmargin: \'12px\','), {
            spacing: '\t',
            name: 'margin',
            value: '12px',
            type: 'jss',
        });
    });
});

suite("calcPropertyType Tests", function () {
    test("Should correctly calculate css type", function () {
        assert.equal(calcPropertyType('margin: 10;'), 'css');
        assert.equal(calcPropertyType('margin: 10'), null);
        assert.equal(calcPropertyType('margin-top: 10;'), 'css');
        assert.equal(calcPropertyType('margin-top: 10,'), 'css');
        assert.equal(calcPropertyType('margin-top: 10'), 'css');
        assert.equal(calcPropertyType('overflow-x: auto;'), 'css');
        assert.equal(calcPropertyType('overflow-x: auto,'), 'css');
        assert.equal(calcPropertyType('overflow-x: auto'), 'css');
        assert.equal(calcPropertyType('-webkit-something: auto;'), 'css');
        assert.equal(calcPropertyType('-webkit-something: auto,'), 'css');
        assert.equal(calcPropertyType('-webkit-something: auto'), 'css');
    });
    test("Should correctly calculate jss type", function () {
        assert.equal(calcPropertyType('margin: 10,'), 'jss');
        assert.equal(calcPropertyType('margin: 10'), null);
        assert.equal(calcPropertyType('marginTop: 10;'), 'jss');
        assert.equal(calcPropertyType('marginTop: 10,'), 'jss');
        assert.equal(calcPropertyType('marginTop: 10'), 'jss');
        assert.equal(calcPropertyType('overflowX: "auto";'), 'jss');
        assert.equal(calcPropertyType('overflowX: "auto",'), 'jss');
        assert.equal(calcPropertyType('overflowX: "auto"'), 'jss');
    });
});

suite("calcMaxType Tests", function () {
    const unknownType: IPropertyDetails = { name: '', spacing: '', type: null, value: '' };
    const cssType: IPropertyDetails = { ...unknownType, type: 'css' };
    const jssType: IPropertyDetails = { ...unknownType, type: 'jss' };

    test("Should correctly calculate max type", function () {
        assert.equal(calcMaxType([]), null);
        assert.equal(calcMaxType([
            ...Array.from<IPropertyDetails>({ length: 1 }).fill(unknownType),
            ...Array.from<IPropertyDetails>({ length: 2 }).fill(cssType),
            ...Array.from<IPropertyDetails>({ length: 3 }).fill(jssType),
        ]), 'jss');
        assert.equal(calcMaxType([
            ...Array.from<IPropertyDetails>({ length: 3 }).fill(unknownType),
            ...Array.from<IPropertyDetails>({ length: 1 }).fill(cssType),
            ...Array.from<IPropertyDetails>({ length: 2 }).fill(jssType),
        ]), null);
        assert.equal(calcMaxType([
            ...Array.from<IPropertyDetails>({ length: 2 }).fill(unknownType),
            ...Array.from<IPropertyDetails>({ length: 3 }).fill(cssType),
            ...Array.from<IPropertyDetails>({ length: 1 }).fill(jssType),
        ]), 'css');
    });
});