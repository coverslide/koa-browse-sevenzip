# Koa-browse-sevenzip

Koa middleware to list or extract archive files based on koa-browse.

## Installation

```
npm install --save koa-browse-sevenzip
```

## Requirements

Koa-browse is required for this middleware to work.

Also a `7z` executable is required to be in the app's PATH. If not, it can be
reassigned using the `sevenzip` module.

```
const SevenZip = require('sevenzip');
SevenZip.executable = "/home/richard/bin/7z";
```