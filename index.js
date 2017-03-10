const fs = require('fs');
const SevenZip = require('sevenzip');
const naturalCompare = require('string-natural-compare');

const { extname, basename } = require('path');

exports.listFiles = function listFiles(options = {}) {
  const action = options.action || 'list';
  const blacklist = options.blacklist && options.blacklist.map(filename => filename.toLowerCase());
  const extensionsWhitelist = options.extensionsWhitelist && options.extensionsWhitelist.map(ext => ext.replace(/^\./, '').toLowerCase());
  const extensionsBlacklist = options.extensionsBlacklist && options.extensionsBlacklist.map(ext => ext.replace(/^\./, '').toLowerCase());
  return async function listFilesAsync(ctx, next) {
    if (
      !ctx.browse ||
      ctx.browse.error ||
      ctx.browse.result ||
      !ctx.browse.stat ||
      !ctx.browse.stat.isFile() ||
      ctx.request.query.action !== action
    ) {
      await next();
      return;
    }
    try {
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
        files.sort((a, b) => naturalCompare(a.filename.toLowerCase(), b.filename.toLowerCase()));
      }
      ctx.browse.result = files;
    } catch (e) {
      ctx.browse.error = 'Could not list files';
    }
    await next();
  };
};

exports.extractFile = function extractFile(options = {}) {
  const action = options.action || 'extract';
  const blacklist = options.blacklist && options.blacklist.map(filename => filename.toLowerCase());
  const extensionsWhitelist = options.extensionsWhitelist && options.extensionsWhitelist.map(ext => ext.replace(/^\./, '').toLowerCase());
  const extensionsBlacklist = options.extensionsBlacklist && options.extensionsBlacklist.map(ext => ext.replace(/^\./, '').toLowerCase());
  return async function extractFileAsync(ctx, next) {
    if (
      !ctx.browse ||
      ctx.browse.error ||
      ctx.browse.result ||
      !ctx.browse.stat ||
      !ctx.browse.stat.isFile() ||
      ctx.request.query.action !== action
    ) {
      await next();
      return;
    }
    if (!ctx.request.query.extract) {
      ctx.browse.error = 'No file to extract';
      await next();
      return;
    }
    const extract = ctx.request.query.extract;
    if (options.skipDotFiles) {
      if (basename(extract).match(/^\./)) {
        await next();
        return;
      }
    }
    if (blacklist) {
      const parts = extract.split('/');
      if (parts.some(part => blacklist.includes(part.toLowerCase()))) {
        await next();
        return;
      }
    }
    if (extensionsWhitelist) {
      if (!extensionsWhitelist.includes(extname(extract).replace(/^\./, '').toLowerCase())) {
        await next();
        return;
      }
    }
    if (extensionsBlacklist) {
      if (extensionsBlacklist.includes(extname(extract).replace(/^\./, '').toLowerCase())) {
        await next();
        return;
      }
    }
    try {
      const filename = await SevenZip.extractFile(ctx.browse.path, ctx.query.extract);
      ctx.response.type = extname(filename);
      ctx.browse.result = fs.createReadStream(filename);
    } catch (e) {
      ctx.browse.error = 'Could not extract file';
    }
    await next();
  };
};
