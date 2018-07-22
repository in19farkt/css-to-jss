import { commands, ExtensionContext, TextEditor, TextEditorEdit, workspace } from 'vscode';
import SimpleIterator from './SimpleIterator';

export function activate(context: ExtensionContext) {
  let disposable = commands.registerTextEditorCommand('extension.cssToJss', convertStyles);

  context.subscriptions.push(disposable);
}

function convertStyles(textEditor: TextEditor, textEditorEdit: TextEditorEdit) {
  const { selections } = textEditor;

  const config = workspace.getConfiguration("css-to-jss");
  const isDoubleQuotes: boolean = config.get('use-double-quotes') || false;

  selections.forEach(selection => {
    Array.from(new SimpleIterator(selection.start.line, selection.end.line)).forEach(lineIndex => {
      const line = textEditor.document.lineAt(lineIndex);

      const detailedProperty = parseProperty(line.text);
      if (!detailedProperty) { return; }

      const { spacing, name, value } = detailedProperty;

      textEditorEdit.replace(line.range, `${spacing}${toCamelCase(name)}: ${formatValue(value, isDoubleQuotes)},`);
    });
  });
}

interface IPropertyDetails {
  spacing: string;
  name: string;
  value: string;
}

function parseProperty(property: string): IPropertyDetails | null {
  const match = /^( *?)([-\w]+):? ?['"]?([^;{}]+?)['"]?[,;]?$/.exec(property);
  if (!match) { return null; }

  const [, spacing, name, value] = match;
  return { spacing, name, value };
}

function toCamelCase(value: string) {
  return value.replace(/\W+(.)/g, function (_match, chr) {
    return chr.toUpperCase();
  });
}

function formatValue(value: string, isDoubleQuotes: boolean) {
  if (/^\d+(\.\d+?)?(px)?$/.test(value)) {
    return parseFloat(value);
  }
  const quote = isDoubleQuotes ? '"' : '\'';
  return `${quote}${value}${quote}`;
}
