const SevenZip = require('sevenzip');
const fs = require('mz/fs');

const { extname, basename } = require('path');

exports.listFiles = function listFiles (options = {}) {
  const blacklist = options.blacklist && options.blacklist.map(filename => filename.toLowerCase());
  const extensionsWhitelist = options.extensionsWhitelist && options.extensionsWhitelist.map(ext => ext.replace(/^\./, '').toLowerCase());
  const extensionsBlacklist = options.extensionsBlacklist && options.extensionsBlacklist.map(ext => ext.replace(/^\./, '').toLowerCase());
  return async function (ctx, next) {
    if (!ctx.browse || ctx.browse.error || ctx.browse.result || !ctx.browse.stat || !ctx.browse.stat.isFile() || ctx.request.query.action != options.action) {
      return await next();
    }
    let files = await SevenZip.getFiles(ctx.browse.path);
    if (options.hideDotFiles) {
      files = files.filter(file => !file.filename.match(/^\./));
    }
    if (blacklist) {
      files = files.filter(file => !blacklist.includes(file.filename.toLowerCase()));
    }
    if (extensionsWhitelist) {
      files = files.filter(file => extensionsWhitelist.includes(extname(file.filename).replace(/^\./, '').toLowerCase()));
    }
    if (extensionsBlacklist) {
      files = files.filter(file => !extensionsBlacklist.includes(extname(file.filename).replace(/^\./, '').toLowerCase()));
    }
    if (options.sort) {
      files.sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 :  a.toLowerCase() < b.toLowerCase() ? -1 : 0);
    }
    ctx.browse.result = files;
    await next();
  };
};

exports.extractFile = function extractFile (options = {}) {
  const blacklist = options.blacklist && options.blacklist.map(filename => filename.toLowerCase());
  const extensionsWhitelist = options.extensionsWhitelist && options.extensionsWhitelist.map(ext => ext.replace(/^\./, '').toLowerCase());
  const extensionsBlacklist = options.extensionsBlacklist && options.extensionsBlacklist.map(ext => ext.replace(/^\./, '').toLowerCase());
  return async function (ctx, next) {
    if (!ctx.browse || ctx.browse.error || ctx.browse.result || !ctx.browse.stat || !ctx.browse.stat.isFile() || ctx.request.query.action != options.action || ! ctx.request.query.extract) {
      return await next();
    }
    const extract = ctx.request.query.extract;
    if (options.skipDotFiles) {
      if(basename(file.filename).match(/^\./)) {
        return await next();
      }
    }
    if (blacklist) {
      const parts = extract.split('/');
      if (parts.some(part => blacklist.includes(part.toLowerCase()))) {
        return await next();
      }
    }
    if (extensionsWhitelist) {
      if (!extensionsWhitelist.includes(extname(extract).replace(/^\./, '').toLowerCase())) {
        return await next();
      }
    }
    if (extensionsBlacklist) {
      if (extensionsBlacklist.includes(extname(extract).replace(/^\./, '').toLowerCase())) {
        return await next();
      }
    }
    const filename = await SevenZip.extractFile(ctx.browse.path, ctx.query.extract);
    ctx.response.type = extname(filename);
    ctx.browse.result = fs.createReadStream(filename);
    await next();
  };
};