import PermissionSet from "../types/permissionSet";

var xml2js = require('xml2js');
const configs = {
    permsetExtension: '.permissionset-meta.xml',
    appExtension: '.app-meta.xml',
    fieldExtension: '.field-meta.xml',
    recordTypeExtension: '.recordType-meta.xml',
    objectExtension: '.object-meta.xml',
    tabExtension: '.tab-meta.xml',
    classExtension: '.cls-meta.xml',
    layoutExtension: '.layout-meta.xml',
    pageExtension: '.page-meta.xml',
    profileExtension: '.profile-meta.xml',
    translationExtension: '.translation-meta.xml',
    customLabelExtension: '.labels-meta.xml',
    globalValueSetExtension: '.globalValueSet-meta.xml',
    permsetFolder: 'permissionsets',
    emptyPermSet: new Promise<PermissionSet>(function(resolve, reject) {
        const strEmptypermSet='<?xml version="1.0" encoding="UTF-8"?>\
        <PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">\
        </PermissionSet>';
        xml2js.parseString(strEmptypermSet, function (err:Error, result:any) {
            resolve(result.PermissionSet as PermissionSet);
        })
    })
    
};

module.exports = configs;

export default interface ISfdxConfigs{
    permsetExtension:string;
    appExtension:string;
    fieldExtension:string;
    recordTypeExtension:string;
    objectExtension:string;
    tabExtension:string;
    classExtension:string;
    layoutExtension:string;
    pageExtension:string;
    profileExtension:string;
    permsetFolder:string;
    translationExtension:string;
    customLabelExtension:string;
    globalValueSetExtension:string;
    emptyPermSet:Promise<PermissionSet>;
}



