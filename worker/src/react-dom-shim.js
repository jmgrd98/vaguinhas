module.exports = {
  renderToStaticMarkup: (element) => {
    // Implement a simple renderer or use actual react-dom/server
    if (typeof element === 'string') return element;
    return `<div>${element.props.children}</div>`;
  }
};