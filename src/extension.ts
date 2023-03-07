import { commands, ExtensionContext, TextEditor, TextEditorEdit, workspace, TextLine } from 'vscode';
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
    const lines: Array<[TextLine, IPropertyDetails]> = Array
      .from(new SimpleIterator(selection.start.line, selection.end.line))
      .map(lineIndex => {
        const line = textEditor.document.lineAt(lineIndex);
        return [line, parseProperty(line.text)];
      })
      .filter(([_, detail]) => Boolean(detail)) as Array<[TextLine, IPropertyDetails]>;

    const maxType = calcMaxType(lines.map(([_, details]) => details));
    const completeLines = lines.map<[TextLine, IPropertyDetails]>(
      ([line, details]) => [line, { ...details, type: details.type || maxType }]
    );

    completeLines
      .filter(([_, details]) => Boolean(details.type))
      .forEach(([line, details]) => textEditorEdit.replace(line.range, formatProperty(details, config)));
  });
}

type PropertyType = 'css' | 'jss';

export interface IPropertyDetails {
  spacing: string;
  name: string;
  value: string;
  type: PropertyType | null;
}

export function calcMaxType(details: IPropertyDetails[]): PropertyType | null {
  interface IResult {
    css: IPropertyDetails[];
    jss: IPropertyDetails[];
    unknown: IPropertyDetails[];
  }
  if (!details.length) { return null; }
  const grouped = details.reduce<IResult>(
    (acc, cur) => {
      acc[cur.type || 'unknown'].push(cur);
      return acc;
    },
    { css: [], jss: [], unknown: [], },
  );
  return [grouped.css, grouped.jss, grouped.unknown].sort((a, b) => b.length - a.length)[0][0].type;
}

export function parseProperty(property: string): IPropertyDetails | null {
  const match = /^([ \t]*?)([-\w]+):? ?['"]?([^;{}]+?)['"]?[,;]?[ \t]*?$/.exec(property);
  const type = calcPropertyType(property);
  if (!match) { return null; }

  const [, spacing, name, value] = match;
  return { spacing, name, value, type };
}

export function calcPropertyType(property: string): PropertyType | null {
  return (isCSS(property) && 'css') || (isJSS(property) && 'jss') || null;
}

function isCSS(item: string) {
  return isCSSName(item) || !isJSSName(item) && (item.trim().match(/;$/g) || []).length === 1;
}

function isJSS(item: string) {
  return isJSSName(item) || !isCSSName(item) && (item.trim().match(/,$/g) || []).length === 1;
}

function isCSSName(item: string) {
  return /^.+?-.+?:.+$/.test(item);
}

function isJSSName(item: string) {
  return /^.+?[A-Z].*?:.+$/.test(item);
}

function formatProperty(property: IPropertyDetails, config: IConfig) {
  const formatter = property.type === 'css' ? toJSS : toCSS;
  return formatter(property, config);
}

function toJSS({ spacing, name, value }: IPropertyDetails, config: IConfig) {
  const shouldRemovePx = propertiesWithPx.includes(name)
  return `${spacing}${toCamel(name)}: ${formatJssValue(value, config.isDoubleQuotes, shouldRemovePx)},`;
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

function formatJssValue(value: string, isDoubleQuotes: boolean, shouldRemovePx: boolean) {
  if (shouldRemovePx && /^\d+(\.\d+?)?(px)?$/.test(value)) {
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
