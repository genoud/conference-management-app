"use strict";
exports.__esModule = true;
var permissionSet_1 = require("../types/permissionSet");
var fsutils_1 = require("../../lib/fsutils");
var glob = require("glob");
var fs = require('fs');
var path = require('path');
var configs = require('./global');
var xml2js = require('xml2js');
//const fsUtils = require('./../../lib/fsutils');
var strEmptypermSet = '<?xml version="1.0" encoding="UTF-8"?>\
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">\
</PermissionSet>';
var AcnPermissionSetUtils = /** @class */ (function () {
    function AcnPermissionSetUtils() {
    }
    AcnPermissionSetUtils.buildPermset = function (srcFolder, filePath, name) {
        var permissionSet = null;
        xml2js.parseString(strEmptypermSet, function (err, result) {
            permissionSet = AcnPermissionSetUtils.createPermissionSet(result.PermissionSet, srcFolder);
            permissionSet.label = name;
            permissionSet.description = "Administrator permission set created for development purpose";
            var builder = new xml2js.Builder({ rootName: "PermissionSet" });
            var xml = builder.buildObject(permissionSet);
            fs.writeFileSync(filePath, xml);
        });
        return permissionSet;
    };
    AcnPermissionSetUtils.createPermissionSet = function (permissionSet, srcFolder) {
        var metadataFiles = fsutils_1["default"].getAllFilesSync(srcFolder);
        metadataFiles.forEach(function (metadataFile) {
            if (metadataFile.endsWith(configs.appExtension)) {
                permissionSet = AcnPermissionSetUtils.buildAppVisibility(permissionSet, metadataFile);
            }
            if (metadataFile.endsWith(configs.objectExtension)) {
                permissionSet = AcnPermissionSetUtils.buildObjectPermissions(permissionSet, metadataFile);
            }
            if (metadataFile.endsWith(configs.tabExtension)) {
                permissionSet = AcnPermissionSetUtils.buildTabSettings(permissionSet, metadataFile);
            }
            if (metadataFile.endsWith(configs.classExtension)) {
                permissionSet = AcnPermissionSetUtils.buildClassAccesses(permissionSet, metadataFile);
            }
            if (metadataFile.endsWith(configs.pageExtension)) {
                permissionSet = AcnPermissionSetUtils.buildPageAccesses(permissionSet, metadataFile);
            }
            if (metadataFile.endsWith(configs.fieldExtension)) {
                permissionSet = AcnPermissionSetUtils.buildFieldPermissions(permissionSet, metadataFile);
            }
            if (metadataFile.endsWith(configs.recordTypeExtension)) {
                permissionSet = AcnPermissionSetUtils.buildRecordTypeVisibilities(permissionSet, metadataFile);
            }
        });
        return permissionSet;
    };
    AcnPermissionSetUtils.buildAppVisibility = function (permset, appMetadataFile) {
        if (permset.applicationVisibilities === null || permset.applicationVisibilities === undefined) {
            permset.applicationVisibilities = [];
        }
        var appName = fsutils_1["default"].getFileNameWithoudExtension(appMetadataFile, configs.appExtension);
        var appVisibility = {
            application: appName,
            visible: true
        };
        permset.applicationVisibilities.push(appVisibility);
        return permset;
    };
    AcnPermissionSetUtils.buildObjectPermissions = function (permset, objectMetadataFile) {
        if (permset.objectPermissions === null || permset.objectPermissions === undefined) {
            permset.objectPermissions = [];
        }
        var objectName = fsutils_1["default"].getFileNameWithoudExtension(objectMetadataFile, configs.objectExtension);
        var objectPermission = {
            object: objectName,
            allowCreate: true,
            allowDelete: true,
            allowEdit: true,
            allowRead: true,
            modifyAllRecords: true,
            viewAllRecords: true
        };
        permset.objectPermissions.push(objectPermission);
        return permset;
    };
    AcnPermissionSetUtils.buildTabSettings = function (permset, tabMetadataFile) {
        if (permset.tabSettings === null || permset.tabSettings === undefined) {
            permset.tabSettings = [];
        }
        var tabName = fsutils_1["default"].getFileNameWithoudExtension(tabMetadataFile, configs.tabExtension);
        var tabSetting = {
            tab: tabName,
            visibility: permissionSet_1.PermissionSetTabVisibility.Visible
        };
        permset.tabSettings.push(tabSetting);
        return permset;
    };
    AcnPermissionSetUtils.buildClassAccesses = function (permset, classMetadataFile) {
        if (permset.classAccesses === null || permset.classAccesses === undefined) {
            permset.classAccesses = [];
        }
        var className = fsutils_1["default"].getFileNameWithoudExtension(classMetadataFile, configs.classExtension);
        var classAccess = {
            apexClass: className,
            enabled: true
        };
        permset.classAccesses.push(classAccess);
        return permset;
    };
    AcnPermissionSetUtils.buildPageAccesses = function (permset, pageMetadataFile) {
        if (permset.pageAccesses === null || permset.pageAccesses === undefined) {
            permset.pageAccesses = [];
        }
        var pageName = fsutils_1["default"].getFileNameWithoudExtension(pageMetadataFile, configs.pageExtension);
        var pageAccess = {
            apexPage: pageName,
            enabled: true
        };
        permset.pageAccesses.push(pageAccess);
        return permset;
    };
    AcnPermissionSetUtils.buildFieldPermissions = function (permset, fieldMetadataFile) {
        if (permset.fieldPermissions === null || permset.fieldPermissions === undefined) {
            permset.fieldPermissions = [];
        }
        var fieldName = fsutils_1["default"].getFileNameWithoudExtension(fieldMetadataFile, configs.fieldExtension);
        var fileParts = fieldMetadataFile.split("/");
        var objectName = fileParts[fileParts.length - 3];
        fieldName = objectName + "." + fieldName;
        var fieldPermission = {
            field: fieldName,
            editable: true,
            readable: true
        };
        permset.fieldPermissions.push(fieldPermission);
        return permset;
    };
    AcnPermissionSetUtils.buildRecordTypeVisibilities = function (permset, recordTypeMetadaFile) {
        if (permset.recordTypeVisibilities === null || permset.recordTypeVisibilities === undefined) {
            permset.recordTypeVisibilities = [];
        }
        var recordTypeName = fsutils_1["default"].getFileNameWithoudExtension(recordTypeMetadaFile, configs.recordTypeExtension);
        var fileParts = recordTypeMetadaFile.split("/");
        var objectName = fileParts[fileParts.length - 3];
        recordTypeName = objectName + "." + recordTypeName;
        var recordTypeVisibility = {
            recordType: recordTypeName,
            visible: true
        };
        permset.recordTypeVisibilities.push(recordTypeVisibility);
        return permset;
    };
    return AcnPermissionSetUtils;
}());
exports["default"] = AcnPermissionSetUtils;
