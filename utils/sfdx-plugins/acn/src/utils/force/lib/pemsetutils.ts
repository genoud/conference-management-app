import { ApplicationVisibility } from "..";
import PermissionSet, { PermissionSetFieldPermissions, PermissionSetRecordTypeVisibility, PermissionSetObjectPermissions, PermissionSetTabSetting, PermissionSetTabVisibility, PermissionSetApexClassAccess, PermissionSetApexPageAccess } from "../types/permissionSet";
import ISfdxConfigs from "./global";
import FileUtils from "../../lib/fsutils";
import AcnProfileUtils from "./profileUtils";
import AcnUtils from "../../lib/global";
import MetadataFiles from "./metadataFiles";


var glob = require("glob")
const fs = require('fs');
const path = require('path');
const configs = require('./global') as ISfdxConfigs;
var xml2js = require('xml2js');
//const fsUtils = require('./../../lib/fsutils');

const strEmptypermSet = '<?xml version="1.0" encoding="UTF-8"?>\
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">\
</PermissionSet>';
const SYSTEM_FIELDS = ["OwnerId"];
const nonArayProperties = ["description", "hasActivationRequired", "label", "license", "userLicense", "$"];

export default class AcnPermissionSetUtils {

  static metadataFiles: MetadataFiles;

  public static buildPermset(srcFolder: string, filePath: string, name: string): PermissionSet {
    var permissionSet: PermissionSet = null;
    xml2js.parseString(strEmptypermSet, function (err: Error, result: any) {
      permissionSet = AcnPermissionSetUtils.createPermissionSet(result.PermissionSet, srcFolder);
      permissionSet.label = name;
      permissionSet.description = "Administrator permission set created for development purpose";
      var builder = new xml2js.Builder({ rootName: "PermissionSet" });
      var xml = builder.buildObject(permissionSet);
      fs.writeFileSync(filePath, xml);
    });
    return permissionSet;
  }

  private static createPermissionSet(permissionSet: PermissionSet, srcFolder: string): PermissionSet {
    var metadataFiles: string[] = FileUtils.getAllFilesSync(srcFolder);
    metadataFiles.forEach(metadataFile => {
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
  }
  private static hasMasterDetailsField(objectFilePath: string) {
    var fileParts = objectFilePath.split(path.sep);
    var objectFile = fileParts.pop();
    var objectFolderPath = fileParts.join(path.sep);
    var fieldsFolderPath = objectFolderPath + path.sep + "fields";
    var isMasterDetail = false;
    if (fs.existsSync(fieldsFolderPath) == false) {
      return isMasterDetail;
    }
    var fieldComponents: string[] = FileUtils.getAllFilesSync(fieldsFolderPath);
    for (var i = 0; i < fieldComponents.length; i++) {
      var fieldComponent = fieldComponents[i];
      var fieldXml = fs.readFileSync(fieldComponent);
      xml2js.parseString(fieldXml, function (err: Error, result: any) {
        var fieldObj = result.CustomField;
        if (AcnUtils.isNotNull(fieldObj.type)) {

          var objecttype: string = fieldObj.type[0] as string;

          objecttype = objecttype.trim().toLowerCase();
          var compareType = "MasterDetail".trim().toLowerCase();

          if (objecttype === compareType) {
            isMasterDetail = true;
          }
        }
      });
      if (isMasterDetail) {
        break;
      }
    }

    return isMasterDetail;

  }
  private static buildAppVisibility(permset: PermissionSet, appMetadataFile: string): PermissionSet {
    if (permset.applicationVisibilities === null || permset.applicationVisibilities === undefined) {
      permset.applicationVisibilities = [];
    }
    var appName = FileUtils.getFileNameWithoudExtension(appMetadataFile, configs.appExtension);
    let appVisibility: ApplicationVisibility = {
      application: appName,
      visible: true
    };
    permset.applicationVisibilities.push(appVisibility);
    return permset;
  }

  private static buildObjectPermissions(permset: PermissionSet, objectMetadataFile: string): PermissionSet {
    if (permset.objectPermissions === null || permset.objectPermissions === undefined) {
      permset.objectPermissions = [];
    }
    var hasmasterDetailField = AcnPermissionSetUtils.hasMasterDetailsField(objectMetadataFile);
    if (!hasmasterDetailField) {
      var objectName = FileUtils.getFileNameWithoudExtension(objectMetadataFile, configs.objectExtension);
      if (!objectName.endsWith("__mdt")) {
        let objectPermission: PermissionSetObjectPermissions = {
          object: objectName,
          allowCreate: true,
          allowDelete: true,
          allowEdit: true,
          allowRead: true,
          modifyAllRecords: true,
          viewAllRecords: true
        };
        permset.objectPermissions.push(objectPermission);
      }

    }

    return permset;
  }

  private static buildTabSettings(permset: PermissionSet, tabMetadataFile: string): PermissionSet {
    if (permset.tabSettings === null || permset.tabSettings === undefined) {
      permset.tabSettings = [];
    }
    var tabName = FileUtils.getFileNameWithoudExtension(tabMetadataFile, configs.tabExtension);
    let tabSetting: PermissionSetTabSetting = {
      tab: tabName,
      visibility: PermissionSetTabVisibility.Visible
    };
    permset.tabSettings.push(tabSetting);
    return permset;
  }

  private static buildClassAccesses(permset: PermissionSet, classMetadataFile: string): PermissionSet {
    if (permset.classAccesses === null || permset.classAccesses === undefined) {
      permset.classAccesses = [];
    }
    var className = FileUtils.getFileNameWithoudExtension(classMetadataFile, configs.classExtension);
    let classAccess: PermissionSetApexClassAccess = {
      apexClass: className,
      enabled: true
    };
    permset.classAccesses.push(classAccess);
    return permset;
  }

  private static buildPageAccesses(permset: PermissionSet, pageMetadataFile: string): PermissionSet {
    if (permset.pageAccesses === null || permset.pageAccesses === undefined) {
      permset.pageAccesses = [];
    }
    var pageName = FileUtils.getFileNameWithoudExtension(pageMetadataFile, configs.pageExtension);
    let pageAccess: PermissionSetApexPageAccess = {
      apexPage: pageName,
      enabled: true
    };
    permset.pageAccesses.push(pageAccess);
    return permset;
  }

  private static buildFieldPermissions(permset: PermissionSet, fieldMetadataFile: string): PermissionSet {
    if (permset.fieldPermissions === null || permset.fieldPermissions === undefined) {
      permset.fieldPermissions = [];
    }
    if (!AcnPermissionSetUtils.isFieldRequired(fieldMetadataFile)) {
      var fieldName = FileUtils.getFileNameWithoudExtension(fieldMetadataFile, configs.fieldExtension);
      var fileParts = fieldMetadataFile.split(path.sep);
      var objectName = fileParts[fileParts.length - 3];
      if (!objectName.endsWith("__mdt") && !SYSTEM_FIELDS.includes(fieldName)) { //Exclude custom Metadata fields and System fields
        fieldName = objectName + "." + fieldName;
        let fieldPermission: PermissionSetFieldPermissions = {
          field: fieldName,
          editable: true,
          readable: true
        };
        permset.fieldPermissions.push(fieldPermission);
      }
    }

    return permset;
  }

  public static isFieldRequired(fieldPath: string) {
    var fieldXml = fs.readFileSync(fieldPath);
    var required: boolean = false;
    xml2js.parseString(fieldXml, function (err: Error, result: any) {
      var fieldObj = result.CustomField;
      if (AcnUtils.isNotNull(fieldObj.required)) {
        var valRequired = fieldObj.required[0];
        if (valRequired == true || valRequired == "true" || valRequired === "true" || valRequired === true) {
          required = true;
        }
      }
      //else{
      //required=true;
      //}

      if (AcnUtils.isNotNull(fieldObj.type)) {
        var objecttype: string = fieldObj.type[0] as string;

        objecttype = objecttype.trim().toLowerCase();
        var compareType = "MasterDetail".trim().toLowerCase();

        if (objecttype === compareType) {
          required = true;
        }
      }
      else {
        required = true;
      }


    });

    return required;
  }

  private static buildRecordTypeVisibilities(permset: PermissionSet, recordTypeMetadaFile: string): PermissionSet {
    if (permset.recordTypeVisibilities === null || permset.recordTypeVisibilities === undefined) {
      permset.recordTypeVisibilities = [];
    }
    var recordTypeName = FileUtils.getFileNameWithoudExtension(recordTypeMetadaFile, configs.recordTypeExtension);
    var fileParts = recordTypeMetadaFile.split(path.sep);
    var objectName = fileParts[fileParts.length - 3];
    recordTypeName = objectName + "." + recordTypeName;
    let recordTypeVisibility: PermissionSetRecordTypeVisibility = {
      recordType: recordTypeName,
      visible: true
    };
    permset.recordTypeVisibilities.push(recordTypeVisibility);
    return permset;
  }


  // PERMISSION SET COMPLETION
  private static toPermSet(permSetObj: any): PermissionSet {
    var convertedObject: any = {};
    for (var key in permSetObj) {
      if (Array.isArray(permSetObj[key])) {
        //All top element must be arays exept non arrayProperties
        if (nonArayProperties.includes(key)) {
          convertedObject[key] = permSetObj[key][0] === 'true' ? true :
          permSetObj[key][0] === 'false' ? false :
          permSetObj[key][0];
        }
        else {
          var data = [];
          for (var i = 0; i < permSetObj[key].length; i++) {
            var element = AcnProfileUtils.removeArrayNatureOnValue(permSetObj[key][i]);
            data.push(element);
          }
          convertedObject[key] = data;
        }

      }
      else if (nonArayProperties.includes(key)) {
        convertedObject[key] = permSetObj[key];
      }

    }
    return convertedObject as PermissionSet;
  }

  public static complete(srcFolders: string[], allPermissions:boolean, permSet: string) : PermissionSet{
    var permissionSet: PermissionSet = null;
    AcnPermissionSetUtils.metadataFiles = new MetadataFiles();

    srcFolders.forEach(srcFolder => {     
      var normalizedPath = path.join(process.cwd(), srcFolder);
      AcnPermissionSetUtils.metadataFiles.loadComponents(normalizedPath);     
    });

    AcnPermissionSetUtils.metadataFiles.permissionSets.forEach(permsetComponent => {
      if(allPermissions === false){
        if(path.basename(permsetComponent) === permSet || path.relative(permsetComponent, permSet) === ''){
          var permsetXml = fs.readFileSync(permsetComponent);
          var permsetObj: PermissionSet;
          xml2js.parseString(permsetXml, function (err: Error, result: any) {
            permsetObj = AcnPermissionSetUtils.toPermSet(result.PermissionSet);
            AcnPermissionSetUtils.completePermissionSets(permsetObj);
            var builder = new xml2js.Builder({ rootName: "PermissionSet" });
            var xml = builder.buildObject(permsetObj);
            fs.writeFileSync(permsetComponent, xml); 
          });          
        } 
      }
      else{
        var permsetXml = fs.readFileSync(permsetComponent);
        var permsetObj: PermissionSet;
        xml2js.parseString(permsetXml, function (err: Error, result: any) {
          permsetObj = AcnPermissionSetUtils.toPermSet(result.PermissionSet);
          AcnPermissionSetUtils.completePermissionSets(permsetObj);
          var builder = new xml2js.Builder({ rootName: "PermissionSet" });
          var xml = builder.buildObject(permsetObj);
          fs.writeFileSync(permsetComponent, xml); 
        }); 
      }

    });

    return permissionSet;
  }


  private static completePermissionSets(permsetObj : PermissionSet) : PermissionSet{
    permsetObj = AcnPermissionSetUtils.completeAppVisibilities(permsetObj);
    permsetObj = AcnPermissionSetUtils.completeObjectPermissions(permsetObj);
    permsetObj = AcnPermissionSetUtils.completeTabSettings(permsetObj);
    permsetObj = AcnPermissionSetUtils.completeClassAccesses(permsetObj);
    permsetObj = AcnPermissionSetUtils.completePageAccesses(permsetObj);
    permsetObj = AcnPermissionSetUtils.completeFieldPermissions(permsetObj);
    permsetObj = AcnPermissionSetUtils.completeRecordTypeVisibilities(permsetObj);
    return permsetObj;
  }

  private static completeAppVisibilities(permSetObj : PermissionSet) : PermissionSet{
    var appVisibility = permSetObj.applicationVisibilities;
    if(appVisibility === undefined || appVisibility === null){
      appVisibility = new Array();
    }
    AcnPermissionSetUtils.metadataFiles.apps.forEach(appComponent => {
      var name = FileUtils.getFileNameWithoudExtension(appComponent, configs.appExtension);
      var appIsPresent: boolean = false; 
      for(var i=0; i<appVisibility.length; i++){     
        if(appVisibility[i].application === name){
          appIsPresent = true;
          break;
        }
      }
      if(appIsPresent === false){
        permSetObj = AcnPermissionSetUtils.buildAppVisibility(permSetObj, appComponent);
      }
    });
    return permSetObj;
  }

  private static completeObjectPermissions(permSetObj : PermissionSet) : PermissionSet{
    var objPerm = permSetObj.objectPermissions;
    if(objPerm === undefined || objPerm === null){
      objPerm = new Array();
    }
    AcnPermissionSetUtils.metadataFiles.objects.forEach(objectComponent => {
      var name = FileUtils.getFileNameWithoudExtension(objectComponent, configs.objectExtension);
      var objectIsPresent: boolean = false;
      for(var i=0; i<objPerm.length; i++){     
        if(objPerm[i].object === name){
          objectIsPresent = true;
          break;
        }
      }       
      if(objectIsPresent === false){
        permSetObj = AcnPermissionSetUtils.buildObjectPermissions(permSetObj, objectComponent);
      }
    });    
    return permSetObj;
  }

  private static completeTabSettings(permSetObj : PermissionSet) : PermissionSet{
    var tabSettings = permSetObj.tabSettings;
    if(tabSettings === undefined || tabSettings === null){
      tabSettings = new Array();
    }
    AcnPermissionSetUtils.metadataFiles.tabs.forEach(tabComponent => {
      var name = FileUtils.getFileNameWithoudExtension(tabComponent, configs.tabExtension);
      var tabIsPresent: boolean = false;
      for(var i=0; i<tabSettings.length; i++){     
        if(tabSettings[i].tab === name){
          tabIsPresent = true;
          break;
        }
      }        
      if(tabIsPresent === false){
        permSetObj = AcnPermissionSetUtils.buildTabSettings(permSetObj, tabComponent);
      }
    });
    return permSetObj;
  }

  private static completeClassAccesses(permSetObj : PermissionSet) : PermissionSet{
    var classAccesses = permSetObj.classAccesses;
    if(classAccesses === undefined || classAccesses === null){
      classAccesses = new Array();
    }
    AcnPermissionSetUtils.metadataFiles.classes.forEach(classComponent => {
      var name = FileUtils.getFileNameWithoudExtension(classComponent, configs.classExtension);
      var classIsPresent: boolean = false;
      for(var i=0; i<classAccesses.length; i++){     
        if(classAccesses[i].apexClass === name){
          classIsPresent = true;
          break;
        }
      }        
      if(classIsPresent === false){
        permSetObj = AcnPermissionSetUtils.buildClassAccesses(permSetObj, classComponent);
      }
    });
    return permSetObj;
  }

  private static completePageAccesses(permSetObj : PermissionSet) : PermissionSet{
    var pageAccesses = permSetObj.pageAccesses;
    if(pageAccesses === undefined || pageAccesses === null){
      pageAccesses = new Array();
    }
    AcnPermissionSetUtils.metadataFiles.pages.forEach(pageComponent => {
      var name = FileUtils.getFileNameWithoudExtension(pageComponent, configs.pageExtension);
      var pageIsPresent: boolean = false;
      for(var i=0; i<pageAccesses.length; i++){     
        if(pageAccesses[i].apexPage === name){
          pageIsPresent = true;
          break;
        }
      }       
      if(pageIsPresent === false){
        permSetObj = AcnPermissionSetUtils.buildPageAccesses(permSetObj, pageComponent);
      }
    });
    return permSetObj;
  }

  private static completeFieldPermissions(permSetObj : PermissionSet) : PermissionSet{
    var fieldPermissions = permSetObj.fieldPermissions;
    if(fieldPermissions === undefined || fieldPermissions === null){
      fieldPermissions = new Array();
    }
    AcnPermissionSetUtils.metadataFiles.fields.forEach(fieldComponent => {
      var splitName = fieldComponent.split(path.sep);
      var objectName = splitName[splitName.length - 3];
      var name = FileUtils.getFileNameWithoudExtension(fieldComponent, configs.fieldExtension);
      name = objectName.concat('.' +name);
      var fieldIsPresent: boolean = false;
      for(var i=0; i<fieldPermissions.length; i++){     
        if(fieldPermissions[i].field === name){
          fieldIsPresent = true;
          break;
        }
      }        
      if(fieldIsPresent === false){
        permSetObj = AcnPermissionSetUtils.buildFieldPermissions(permSetObj, fieldComponent);
      }
    });
    return permSetObj;
  }

  private static completeRecordTypeVisibilities(permSetObj : PermissionSet) : PermissionSet{
    var recordTypeVisibilities = permSetObj.recordTypeVisibilities;
    if(recordTypeVisibilities === undefined || recordTypeVisibilities === null){
      recordTypeVisibilities = new Array();
    }
    AcnPermissionSetUtils.metadataFiles.recordTypes.forEach(recordTypeComponent => {
      var splitFilepath = recordTypeComponent.split(path.sep);
      var objectName = splitFilepath[splitFilepath.indexOf("objects") + 1];
      objectName = objectName.concat('.');     
      var name = FileUtils.getFileNameWithoudExtension(recordTypeComponent, configs.recordTypeExtension);
      var recordTypeIsPresent: boolean = false;
      for(var i=0; i<recordTypeVisibilities.length; i++){     
        if(recordTypeVisibilities[i].recordType === objectName.concat(name)){
          recordTypeIsPresent = true;
          break;
        }
      }       
      if(recordTypeIsPresent === false){
        permSetObj = AcnPermissionSetUtils.buildRecordTypeVisibilities(permSetObj, recordTypeComponent);
      }
    });
    return permSetObj;
  }

  // RECONCILE PERMISSION SETS
  public static reconcile(srcFolders: string[], allPermissions:boolean, permSet: string): PermissionSet{
    var permissionSet : PermissionSet = null;
    AcnPermissionSetUtils.metadataFiles = new MetadataFiles();
    srcFolders.forEach(srcFolder => {
      var normalizedPath = path.join(process.cwd(), srcFolder);
      AcnPermissionSetUtils.metadataFiles.loadComponents(normalizedPath);
    });

    AcnPermissionSetUtils.metadataFiles.permissionSets.forEach(permsetComponent => {
      if(allPermissions === false){
        if(path.basename(permsetComponent) === permSet || path.relative(permsetComponent, permSet) === ''){
          var permsetXml = fs.readFileSync(permsetComponent);    
          xml2js.parseString(permsetXml, function (err: Error, result: any) {
            var permsetObj: PermissionSet = AcnPermissionSetUtils.toPermSet(result.PermissionSet); 
            AcnPermissionSetUtils.removePermissions(permsetObj);
            // remove userLicence from standard profiles
            /* if(permsetObj.custom===false){
              delete permsetObj.userPermissions;
            } */
            //Delete eampty arrays
            for (var key in permsetObj) {
              if (Array.isArray(permsetObj[key])) {
                //All top element must be arays exept non arrayProperties
                if (!nonArayProperties.includes(key) && permsetObj[key].length===0) {
                  delete permsetObj[key];
                }
              }
            } 
            var builder = new xml2js.Builder({ rootName: "PermissionSet" });
            var xml = builder.buildObject(permsetObj);
            fs.writeFileSync(permsetComponent, xml);       
          });
        }
      }else{
          var permsetXml = fs.readFileSync(permsetComponent);    
          xml2js.parseString(permsetXml, function (err: Error, result: any) {
            var permsetObj: PermissionSet = AcnPermissionSetUtils.toPermSet(result.PermissionSet); 
            AcnPermissionSetUtils.removePermissions(permsetObj);
            // remove userLicence from standard profiles
            /* if(permsetObj.custom===false){
              delete permsetObj.userPermissions;
            } */
            //Delete eampty arrays
            for (var key in permsetObj) {
              if (Array.isArray(permsetObj[key])) {
                //All top element must be arays exept non arrayProperties
                if (!nonArayProperties.includes(key) && permsetObj[key].length===0) {
                  delete permsetObj[key];
                }
              }
            } 
            var builder = new xml2js.Builder({ rootName: "PermissionSet" });
            var xml = builder.buildObject(permsetObj);
            fs.writeFileSync(permsetComponent, xml);       
          });
      }
    });
    return permissionSet;
  }
  
  private static removePermissions(permsetObj : PermissionSet) : PermissionSet{
    permsetObj = AcnPermissionSetUtils.reconcileApps(permsetObj);
    permsetObj = AcnPermissionSetUtils.reconcileObjects(permsetObj);
    permsetObj = AcnPermissionSetUtils.reconcileTabs(permsetObj);
    permsetObj = AcnPermissionSetUtils.reconcileClasses(permsetObj);
    permsetObj = AcnPermissionSetUtils.reconcilePages(permsetObj);
    permsetObj = AcnPermissionSetUtils.reconcileFields(permsetObj);
    permsetObj = AcnPermissionSetUtils.reconcileRecordTypes(permsetObj);
    return permsetObj;
  }

  private static reconcileApps(permsetObj: PermissionSet): PermissionSet {
    var files = AcnPermissionSetUtils.metadataFiles.apps;
    if (permsetObj.applicationVisibilities !== undefined) {
      var validArray = permsetObj.applicationVisibilities.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.appExtension);
          if (name === cmpObj.application) {
            return true;
          }
        }
        return false;
      });
      permsetObj.applicationVisibilities = validArray;
    }
    return permsetObj;
  }

  private static reconcileObjects(permsetObj: PermissionSet): PermissionSet {
    var files = AcnPermissionSetUtils.metadataFiles.objects;
    if (permsetObj.objectPermissions !== undefined) {
      var validArray = permsetObj.objectPermissions.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.objectExtension);
          if (name === cmpObj.object) {
            return true;
          }
        }
        return false;
      });
      permsetObj.objectPermissions = validArray;
    }
    return permsetObj;
  }

  private static reconcileTabs(permsetObj: PermissionSet): PermissionSet {
    var files = AcnPermissionSetUtils.metadataFiles.tabs;
    if (permsetObj.tabSettings !== undefined) {
      var validArray = permsetObj.tabSettings.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.tabExtension);
          if (name === cmpObj.tab) {
            return true;
          }
        }
        return false;
      });
      permsetObj.tabSettings = validArray;
    }
    return permsetObj;
  }

  private static reconcileClasses(permsetObj: PermissionSet): PermissionSet {
    var files = AcnPermissionSetUtils.metadataFiles.classes;
    if (permsetObj.classAccesses !== undefined) {
      var validArray = permsetObj.classAccesses.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.classExtension);
          if (name === cmpObj.apexClass) {
            return true;
          }
        }
        return false;
      });
      permsetObj.classAccesses = validArray;
    }
    return permsetObj;
  }

  private static reconcilePages(permsetObj: PermissionSet): PermissionSet {
    var files = AcnPermissionSetUtils.metadataFiles.pages;
    if (permsetObj.pageAccesses !== undefined) {
      var validArray = permsetObj.pageAccesses.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.pageExtension);
          if (name === cmpObj.apexPage) {
            return true;
          }
        }
        return false;
      });
      permsetObj.pageAccesses = validArray;
    }
    return permsetObj;
  }

  private static reconcileFields(permsetObj: PermissionSet): PermissionSet {
    var files = AcnPermissionSetUtils.metadataFiles.fields;
    if (permsetObj.fieldPermissions !== undefined) {
      var validArray = permsetObj.fieldPermissions.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.fieldExtension);
          var fileParts = files[i].split(path.sep);
          var objectName = fileParts[fileParts.length - 3];
          name = objectName + "." + name;
          if (name === cmpObj.field) {
            return true;
          }
        }
        return false;
      });
      permsetObj.fieldPermissions = validArray;
    }
    return permsetObj;
  }

  private static reconcileRecordTypes(permsetObj: PermissionSet): PermissionSet {
    var files = AcnPermissionSetUtils.metadataFiles.recordTypes;
    if (permsetObj.recordTypeVisibilities !== undefined) {
      var validArray = permsetObj.recordTypeVisibilities.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.recordTypeExtension);
          var fileParts = files[i].split(path.sep);
          var objectName = fileParts[fileParts.length - 3];
          name = objectName + "." + name;
          if (name === cmpObj.recordType) {
            return true;
          }
        }
        return false;
      });
      permsetObj.recordTypeVisibilities = validArray;
    }
    return permsetObj;
  }

}

