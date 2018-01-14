module.exports.prettyPath = path => {
  if (path[0] !== '/') {
    throw new Error(`Path \`${path}\` must begin with a slash.`);
  }

  if (path === '/') {
    return path;
  }

  return path.replace(/\/*/, '/').replace(/\/*$/, '');
};
