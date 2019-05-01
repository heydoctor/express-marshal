module.exports.formatPath = (path, options = {}) => {
  if (path[0] !== '/') {
    throw new Error(`Path \`${path}\` must begin with a slash.`);
  }

  if (path === '/') {
    return path;
  }

  // rewrite params that are :id or  :\w+Id to include numeric regex
  const rewritten = !!options.rewrite ? path.replace(/:(id|\w+Id)/g, ':$1(\\d+)') : path;

  const pretty = rewritten
    .replace(/\/*/, '/')
    .replace(/\/*$/, '');

  console.log(path, pretty);
  return pretty;
};
