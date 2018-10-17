"use strict";
exports.__esModule = true;
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var FileUtils = /** @class */ (function () {
    function FileUtils() {
    }
    FileUtils.getAllFilesSync = function (folder, extension) {
        var _this = this;
        if (extension === void 0) { extension = '.xml'; }
        var result = [];
        var content = fs.readdirSync(folder);
        content.forEach(function (file) {
            var curFile = path.join(folder, file);
            var stats = fs.statSync(curFile);
            if (stats.isFile()) {
                if (extension.indexOf(path.extname(curFile)) != -1) {
                    result.push(curFile);
                }
            }
            else if (stats.isDirectory()) {
                var files = _this.getAllFilesSync(curFile, extension);
                result = _.concat(result, files);
            }
        });
        return result;
    };
    FileUtils.mkDirByPathSync = function (targetDir, _a) {
        var _b = (_a === void 0 ? {} : _a).isRelativeToScript, isRelativeToScript = _b === void 0 ? false : _b;
        var sep = path.sep;
        var initDir = path.isAbsolute(targetDir) ? sep : '';
        var baseDir = isRelativeToScript ? __dirname : '.';
        targetDir.split(sep).reduce(function (parentDir, childDir) {
            var curDir = path.resolve(baseDir, parentDir, childDir);
            try {
                fs.mkdirSync(curDir);
            }
            catch (err) {
                if (err.code !== 'EEXIST' && err.code !== 'EPERM') {
                    throw err;
                }
            }
            return curDir;
        }, initDir);
    };
    FileUtils.getFileNameWithoudExtension = function (filePath, extention) {
        var fileParts = filePath.split(path.sep);
        var fileName = fileParts[fileParts.length - 1];
        fileName = fileName.substr(0, fileName.lastIndexOf(extention));
        return fileName;
    };
    return FileUtils;
}());
exports["default"] = FileUtils;
