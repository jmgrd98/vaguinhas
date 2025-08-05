import { renderToStaticMarkup } from './react-dom-shim';

module.exports = {
  render: (element, options = {}) => {
    if (options.pretty) {
      return `<!DOCTYPE html>\n${renderToStaticMarkup(element)}`;
    }
    return renderToStaticMarkup(element);
  }
};