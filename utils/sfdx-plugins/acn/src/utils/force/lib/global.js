"use strict";
exports.__esModule = true;
var glob = require("glob");
var xml2js = require('xml2js');
module.exports = {
    permsetExtension: '.permissionset-meta.xml',
    appExtension: '.app-meta.xml',
    fieldExtension: '.field-meta.xml',
    recordTypeExtension: '.recordType-meta.xml',
    objectExtension: '.object-meta.xml',
    tabExtension: '.tab-meta.xml',
    classExtension: '.cls-meta.xml',
    pageExtension: '.page-meta.xml',
    permsetFolder: 'permissionsets',
    emptyPermSet: new Promise(function (resolve, reject) {
        var strEmptypermSet = '<?xml version="1.0" encoding="UTF-8"?>\
        <PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">\
        </PermissionSet>';
        xml2js.parseString(strEmptypermSet, function (err, result) {
            resolve(result.PermissionSet);
        });
    })
};
