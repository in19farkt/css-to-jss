import { commands, ExtensionContext, TextEditor, TextEditorEdit, workspace } from 'vscode';
import SimpleIterator from './SimpleIterator';

export function activate(context: ExtensionContext) {
  let disposable = commands.registerTextEditorCommand('extension.cssToJss', convertStyles);

  context.subscriptions.push(disposable);
}

interface IConfig {
  isDoubleQuotes: boolean;
}

function convertStyles(textEditor: TextEditor, textEditorEdit: TextEditorEdit) {
  const { selections } = textEditor;

  const extensionConfig = workspace.getConfiguration("css-to-jss");
  const config: IConfig = {
    isDoubleQuotes: extensionConfig.get('use-double-quotes') || false,
  };

  selections.forEach(selection => {
    Array.from(new SimpleIterator(selection.start.line, selection.end.line)).forEach(lineIndex => {
      const line = textEditor.document.lineAt(lineIndex);

      const detailedProperty = parseProperty(line.text);
      if (!detailedProperty) { return; }

      textEditorEdit.replace(line.range, formatProperty(detailedProperty, config));
    });
  });
}

interface IPropertyDetails {
  spacing: string;
  name: string;
  value: string;
  type: 'css' | 'jss';
}

function parseProperty(property: string): IPropertyDetails | null {
  const match = /^( *?)([-\w]+):? ?['"]?([^;{}]+?)['"]?[,;]?$/.exec(property);
  const type: IPropertyDetails['type'] | null = (isCSS(property) && 'css') || (isJSS(property) && 'jss') || null;
  if (!match || !type) { return null; }

  const [, spacing, name, value] = match;
  return { spacing, name, value, type };
}

function isCSS(item: string) {
  return (item.match(/;/g) || []).length === 1;
}

function isJSS(item: string) {
  return (item.trim().match(/,$/g) || []).length === 1;
}

function formatProperty(property: IPropertyDetails, config: IConfig) {
  const formatter = property.type === 'css' ? toJSS : toCSS;
  return formatter(property, config);
}

function toJSS({ spacing, name, value }: IPropertyDetails, config: IConfig) {
  return `${spacing}${toCamel(name)}: ${formatJssValue(value, config.isDoubleQuotes)},`;
}

function toCSS({ spacing, name, value }: IPropertyDetails, config: IConfig) {
  const cssName = toHyphen(name);
  return `${spacing}${cssName}: ${formatCssValue(value, cssName)};`;
}

function toHyphen(value: string) {
  return value.replace(/([A-Z])/g, char => `-${char[0].toLowerCase()}`);
}

function toCamel(value: string) {
  return value.replace(/\W+(.)/g, (_match, chr) => chr.toUpperCase());
}

function formatJssValue(value: string, isDoubleQuotes: boolean) {
  if (/^\d+(\.\d+?)?(px)?$/.test(value)) {
    return parseFloat(value);
  }
  const quote = isDoubleQuotes ? '"' : '\'';
  return `${quote}${value}${quote}`;
}

const propertiesWithPx = [
  "top", "right", "bottom", "left", "flex-basis", "margin", "margin-top", "margin-right", "margin-bottom",
  "margin-left", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "min-width",
  "min-height", "max-width", "max-height", "width", "height", "outline-width", "outline-offset", "border-spacing",
  "border-width", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius",
  "border-bottom-left-radius", "border-image-width", "border-image-outset", "background-position",
  "background-position-x", "background-position-y", "background-size", "text-indent", "letter-spacing",
  "font-size", "columns", "column-width", "column-gap", "column-rule-width",
];

function formatCssValue(value: string, cssName: string): string {
  if (Number(value)) {
    const withPx = propertiesWithPx.includes(cssName);
    return withPx ? `${value}px` : value;
  }
  return value;
}
