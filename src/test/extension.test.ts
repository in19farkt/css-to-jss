//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { parseProperty } from '../extension';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("parseProperty Tests", function () {

    // Defines a Mocha unit test
    test("Should parse correct property", function() {
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