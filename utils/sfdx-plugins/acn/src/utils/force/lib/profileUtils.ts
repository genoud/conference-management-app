import ISfdxConfigs from "./global";
import FileUtils from "../../lib/fsutils";
import Profile, { ProfileRecordTypeVisibility, ProfileApplicationVisibility, ProfileTabVisibility, TabVisibility, ProfileFieldLevelSecurity, ProfileApexClassAccess, ProfileApexPageAccess, ProfileLayoutAssignments, ProfileObjectPermissions } from "../types/profile";
import MetadataFiles from "./metadataFiles";
import { Connection } from "@salesforce/core";
import AcnForceUtils from "./acnforce";
import { MetadataInfo } from "jsforce";


var glob = require("glob")
const fs = require('fs');
const path = require('path');
const configs = require('./global') as ISfdxConfigs;
var xml2js = require('xml2js');

const unsupportedLicences = ["ManageSandboxes", "ManageCssUsers", "ManageEncryptionKeys", 
 "AddDirectMessageMembers", "RemoveDirectMessageMembers"];

const unsupportedprofiles=["Guest License User", "Interface MFB", "Interface WL", "Premier Support User"];

const nonArayProperties = ["custom", "description", "fullName", "userLicense", "$"];

const excludedFolder= ["ccare-limit-issues"];

const PROFILE_NAMESPACE = "http://soap.sforce.com/2006/04/metadata";

export default class AcnProfileUtils {

  applicationsFiles: string[];
  classFiles: string[];
  fieldFiles: string[];
  layoutFiles: string[];
  objectFiles: string[];
  pageFiles: string[];
  recordTypeFile: string[];
  tabFiles: string[];

  metadataFiles: MetadataFiles;

  public async sync(srcFolders: string[], conn: Connection, reconcile?: boolean, profileNames?: string[]): Promise<String[]> {
    var me = this;
    this.metadataFiles = new MetadataFiles();
    for (var i = 0; i < srcFolders.length; i++) {
      var srcFolder = srcFolders[i];
      if(!excludedFolder.includes(srcFolder)){
        var normalizedPath = path.join(process.cwd(), srcFolder);
        this.metadataFiles.loadComponents(normalizedPath);
      }
    }
    var profileList: string[] = [];
    var prolieNames: string[] = [];
    var profilePathAssoc = {};
    var metadataFiles = this.getMetadataComponents(profileNames);
    for (var i = 0; i < metadataFiles.length; i++) {
      var profileComponent = metadataFiles[i];
      var profileName = path.basename(profileComponent, AcnForceUtils.profileExtension);
      var supported = !unsupportedprofiles.includes(profileName);
      if(supported){
        profilePathAssoc[profileName] = profileComponent;
        prolieNames.push(profileName);
      }
    }
    console.log("Loading profiles from server ");
    var i: number, j: number, chunk: number = 10;
    var temparray;
    for (i = 0, j = prolieNames.length; i < j; i += chunk) {
      temparray = prolieNames.slice(i, i + chunk);
      console.log(temparray.length);
      var batchList = await this.loadProfiles(temparray, profilePathAssoc, conn, reconcile);
      profileList.push(...batchList);
    }

    return Promise.resolve(profileList);
  }

  private async loadProfiles(profileNames: string[], profilePathAssoc, conn, reconcile: boolean): Promise<string[]> {
    var me = this;
    var profileList: string[] = [];
    var metadata: MetadataInfo | MetadataInfo[] = await this.loadProfile(profileNames, conn);
    if (Array.isArray(metadata)) {
      console.log('Length: ' + metadata.length);
      for (var i = 0; i < metadata.length; i++) {
        this.writeProfile(metadata[i], reconcile, profileList, profilePathAssoc );
      }
    }
    else {
      console.log("Nothing found");
      this.writeProfile(metadata, reconcile, profileList, profilePathAssoc);

    }
    return Promise.resolve(profileList);
  }

  private writeProfile(metadata, reconcile, profileList, profilePathAssoc) {
    var profileObj = metadata as Profile;
    if (reconcile) {
      //Reconcile with component in the folders
      this.removePermissions(profileObj);
    }

    

    // remove unsupported userLicence
    if (profileObj.userPermissions != null && profileObj.userPermissions.length > 0) {
      profileObj.userPermissions = profileObj.userPermissions.filter(permission => {
        var supported = !unsupportedLicences.includes(permission.name);
        return supported;
      });
    }

    var isCustom=''+profileObj.custom;
    console.log("Is Custom: "+ isCustom);
    if (isCustom == 'false') {
      delete profileObj.userPermissions;
    }


    //Delete eampty arrays
    for (var key in profileObj) {
      if (Array.isArray(profileObj[key])) {
        //All top element must be arays exept non arrayProperties
        if (!nonArayProperties.includes(key) && profileObj[key].length === 0) {
          delete profileObj[key];
        }
      }
    }
    if (profileObj.fullName != undefined) {
      var builder = new xml2js.Builder({ rootName: "Profile" });
      profileObj["$"] = {
        xmlns: PROFILE_NAMESPACE
      }
      var xml = builder.buildObject(profileObj);

      profileList.push(profileObj.fullName);
      console.log("Profile " + profileObj.fullName);
      console.log("Writting " + profilePathAssoc[profileObj.fullName]);
      fs.writeFileSync(profilePathAssoc[profileObj.fullName], xml);
      console.log("Profile " + profileObj.fullName + " Sync!");
    }
  }

  private getMetadataComponents(profileNames: string[]): string[] {
    var metadataFiles = this.metadataFiles.profiles;
    if (profileNames && profileNames.length > 0) {
      metadataFiles = [];
      for (var i = 0; i < profileNames.length; i++) {
        var profileName = profileNames[i];
        for (var j = 0; j < this.metadataFiles.profiles.length; j++) {
          var profileComponent = this.metadataFiles.profiles[j];
          var oneName = path.basename(profileComponent, AcnForceUtils.profileExtension);
          if (profileName === oneName) {
            metadataFiles.push(profileComponent);
          }
        }
      }
    }
    return metadataFiles;
  }

  private async loadProfile(profileNames: string[], conn: Connection): Promise<MetadataInfo | MetadataInfo[]> {
    var toReturn: Promise<MetadataInfo | MetadataInfo[]> = null;
    var metadataList: MetadataInfo[];
    var metadata = await conn.metadata.readSync("Profile", profileNames);
    toReturn = Promise.resolve(metadata);
    /*
    if(!Array.isArray(metadata)){
      
       
    }
    else{
      toReturn=Promise.resolve(metadata[0]);

    }
    */

    return toReturn;
  }
  public reconcile(srcFolders: string[]): string[] {
    this.metadataFiles = new MetadataFiles();
    srcFolders.forEach(srcFolder => {
      var normalizedPath = path.join(process.cwd(), srcFolder);
      this.metadataFiles.loadComponents(normalizedPath);
    });
    this.metadataFiles.profiles.forEach(profileComponent => {
      var profileXml = fs.readFileSync(profileComponent);
      xml2js.parseString(profileXml, function (err: Error, result: any) {
        var profileObj: Profile = this.toProfile(result.Profile); // as Profile
        //Reconcile profile here
        this.removePermissions(profileObj);
        // remove userLicence from standard profiles
        var isCustom=''+profileObj.custom;
        console.log("Is Custom: "+ isCustom);
        if (isCustom == 'false') {
          delete profileObj.userPermissions;
        }

        //Delete eampty arrays
        for (var key in profileObj) {
          if (Array.isArray(profileObj[key])) {
            //All top element must be arays exept non arrayProperties
            if (!nonArayProperties.includes(key) && profileObj[key].length === 0) {
              delete profileObj[key];
            }
          }
        }

        var builder = new xml2js.Builder({ rootName: "Profile" });
        var xml = builder.buildObject(profileObj);
        fs.writeFileSync(profileComponent, xml);

      });
    });
    return this.metadataFiles.profiles;
  }

  private toProfile(profileObj: any): Profile {
    var convertedObject: any = {};
    for (var key in profileObj) {
      if (Array.isArray(profileObj[key])) {
        //All top element must be arays exept non arrayProperties
        if (nonArayProperties.includes(key)) {
          convertedObject[key] = profileObj[key][0] === 'true' ? true :
            profileObj[key][0] === 'false' ? false :
              profileObj[key][0];
        }
        else {
          var data = [];
          for (var i = 0; i < profileObj[key].length; i++) {
            var element = AcnProfileUtils.removeArrayNatureOnValue(profileObj[key][i]);
            data.push(element);
          }
          convertedObject[key] = data;
        }

      }
      else if (nonArayProperties.includes(key)) {
        convertedObject[key] = profileObj[key];
      }

    }
    return convertedObject as Profile;
  }

  public static removeArrayNatureOnValue(obj: any): any {
    var toReturn = {};
    for (var key in obj) {
      const nonArayProperties = ["custom", "description", "fullName", "userLicense"];
      if (Array.isArray(obj[key]) && obj[key].length > 0) {
        //All top element must be arays exept non arrayProperties
        toReturn[key] = obj[key][0] === 'true' ? true :
          obj[key][0] === 'false' ? false : obj[key][0];
      }
      else {
        toReturn[key] = obj[key];
      }
    }
    return toReturn;
  }

  private removePermissions(profileObj: Profile): Profile {
    profileObj = this.reconcileApp(profileObj);
    profileObj = this.reconcileClasses(profileObj);
    profileObj = this.reconcileFields(profileObj);
    profileObj = this.reconcileLayouts(profileObj);
    profileObj = this.reconcileObjects(profileObj);
    profileObj = this.reconcilePages(profileObj);
    profileObj = this.reconcileRecordTypes(profileObj);
    profileObj = this.reconcileTabs(profileObj);
    return profileObj;
  }

  private reconcileApp(profileObj: Profile): Profile {
    var files = this.metadataFiles.apps;
    if (profileObj.applicationVisibilities !== undefined) {
      var validArray = profileObj.applicationVisibilities.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.appExtension);
          if (name == cmpObj.application) {
            return true;
          }
        }
        return false;
      })
      profileObj.applicationVisibilities = validArray;
    }


    return profileObj;
  }

  private reconcileClasses(profileObj: Profile): Profile {
    var files = this.metadataFiles.classes;
    if (profileObj.classAccesses !== undefined) {
      var validArray = profileObj.classAccesses.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.classExtension);
          if (name == cmpObj.apexClass) {
            return true;
          }
        }
        return false;
      });
      profileObj.classAccesses = validArray;
    }

    return profileObj;
  }

  private reconcileFields(profileObj: Profile): Profile {
    var files = this.metadataFiles.fields;
    if (profileObj.fieldLevelSecurities !== undefined) {
      var validArray = profileObj.fieldLevelSecurities.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.fieldExtension);
          var fileParts = files[i].split(path.sep);
          var objectName = fileParts[fileParts.length - 3];
          name = objectName + "." + name;
          if (name == cmpObj.field) {
            return true;
          }
        }
        return false;
      })
      profileObj.fieldLevelSecurities = validArray;
    }

    if (profileObj.fieldPermissions !== undefined) {
      validArray = profileObj.fieldPermissions.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.fieldExtension);
          var fileParts = files[i].split(path.sep);
          var objectName = fileParts[fileParts.length - 3];
          name = objectName + "." + name;
          if (name == cmpObj.field) {
            return true;
          }
        }
        return false;
      })
      profileObj.fieldPermissions = validArray;
    }

    return profileObj;
  }

  private recordTypeExists(recordTypeName: string): boolean {
    var files = this.metadataFiles.recordTypes;
    for (var i = 0; i < files.length; i++) {
      var name = FileUtils.getFileNameWithoudExtension(files[i], configs.recordTypeExtension);
      var fileParts = files[i].split(path.sep);
      var objectName = fileParts[fileParts.length - 3];
      name = objectName + "." + name;
      if (name == recordTypeName) {
        return true;
      }
    }
    return false;
  }

  private reconcileLayouts(profileObj: Profile): Profile {
    var files = this.metadataFiles.layouts;
    if (profileObj.layoutAssignments !== undefined) {
      var validArray = profileObj.layoutAssignments.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.layoutExtension);
          if (cmpObj.recordType != undefined) {
            if (name == cmpObj.layout && this.recordTypeExists(cmpObj.recordType)) {
              return true;
            }
          }
          else {
            if (name == cmpObj.layout) {
              return true;
            }
          }

        }
        return false;
      })
      profileObj.layoutAssignments = validArray;
    }
    return profileObj;
  }

  private reconcileObjects(profileObj: Profile): Profile {
    var files = this.metadataFiles.objects;
    if (profileObj.objectPermissions !== undefined) {
      var validArray = profileObj.objectPermissions.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.objectExtension);
          if (name == cmpObj.object) {
            return true;
          }
        }
        return false;
      });
      profileObj.objectPermissions = validArray;
    }
    return profileObj;
  }
  private reconcilePages(profileObj: Profile): Profile {
    var files = this.metadataFiles.pages;
    if (profileObj.pageAccesses !== undefined) {
      var validArray = profileObj.pageAccesses.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.pageExtension);
          if (name == cmpObj.apexPage) {
            return true;
          }
        }
        return false;
      })
      profileObj.pageAccesses = validArray;
    }
    return profileObj;
  }

  private reconcileRecordTypes(profileObj: Profile): Profile {
    var files = this.metadataFiles.recordTypes;
    if (profileObj.recordTypeVisibilities !== undefined) {
      var validArray = profileObj.recordTypeVisibilities.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.recordTypeExtension);
          var fileParts = files[i].split(path.sep);
          var objectName = fileParts[fileParts.length - 3];
          name = objectName + "." + name;
          if (name == cmpObj.recordType) {
            return true;
          }
        }
        return false;
      });
      this.ensureDefaultRecordType(validArray);
      profileObj.recordTypeVisibilities = validArray;
      //console.log(profileObj.recordTypeVisibilities);
    }
    return profileObj;
  }

  private ensureDefaultRecordType(recordTypeList: ProfileRecordTypeVisibility[]) {
    var objectRecordType = {};
    //console.log(recordTypeList);
    recordTypeList.forEach((value) => {
      var objectName = value.recordType.substr(0, value.recordType.indexOf("."));
      if (objectRecordType[objectName] == undefined) {
        objectRecordType[objectName] = [value];
      }
      else {
        objectRecordType[objectName].push(value);
      }
    });

    for (var key in objectRecordType) {
      var objRecordTypeList = objectRecordType[key];
      var isdefault = false;
      for (var i = 0; i < objRecordTypeList.length; i++) {
        var isDefaultRecordType = '' + objRecordTypeList[i].default;
        if (isDefaultRecordType == 'true') {
          isdefault = true;
          objRecordTypeList[i].visible = true;
          continue;
        }
        if (isdefault) {
          objRecordTypeList[i].default = false;
        }

      }
      if (isdefault === false) {
        objRecordTypeList[0].default = true;
        objRecordTypeList[0].visible = true;
      }
    }

    //console.log(recordTypeList);
  }

  private reconcileTabs(profileObj: Profile): Profile {
    var files = this.metadataFiles.tabs;
    if (profileObj.tabVisibilities !== undefined) {
      var validArray = profileObj.tabVisibilities.filter((cmpObj, index) => {
        for (var i = 0; i < files.length; i++) {
          var name = FileUtils.getFileNameWithoudExtension(files[i], configs.tabExtension);
          if (name == cmpObj.tab) {
            return true;
          }
        }
        return false;
      })
      profileObj.tabVisibilities = validArray;
    }
    return profileObj;
  }


  /* FUNCTION TO COMPLETE PROFILE PERMISSIONS BASED ON COMPONENT PRESENT IN SOURCE FOLDER */
  public complete(srcFolders: string[], allProfiles: boolean, profile: string): string[] {
    console.log(srcFolders);
    this.metadataFiles = new MetadataFiles();

    srcFolders.forEach(srcFolder => {

      var normalizedPath = path.join(process.cwd(), srcFolder);
      this.metadataFiles.loadComponents(normalizedPath);

      console.log(normalizedPath);
    });


    this.metadataFiles.profiles.forEach(profileComponent => {
      console.log(profileComponent);

      if (allProfiles === false) {
        if (path.basename(profileComponent) === profile || path.relative(profileComponent, profile) === '') {
          console.log("targeted profile: " + profileComponent);

          var profileXml = fs.readFileSync(profileComponent);
          var profileObj: Profile;
          xml2js.parseString(profileXml, function (err: Error, result: any) {
            profileObj = this.toProfile(result.Profile); // as Profile
            //console.log(profileObj);

            this.completePermissions(profileObj);

            var builder = new xml2js.Builder({ rootName: "Profile" });
            var xml = builder.buildObject(profileObj);
            fs.writeFileSync(profileComponent, xml);
          });

        }
      } else {
        var profileXml = fs.readFileSync(profileComponent);
        var profileObj: Profile;
        xml2js.parseString(profileXml, function (err: Error, result: any) {
          profileObj = this.toProfile(result.Profile); // as Profile
          //console.log(profileObj);

          this.completePermissions(profileObj);

          var builder = new xml2js.Builder({ rootName: "Profile" });
          var xml = builder.buildObject(profileObj);
          fs.writeFileSync(profileComponent, xml);
        });
      }

    });

    return this.metadataFiles.profiles;
  }

  private completePermissions(profileObj: Profile): Profile {
    profileObj = this.completeObjects(profileObj);
    profileObj = this.completeAppVisibilities(profileObj);
    profileObj = this.completeTabVisibilities(profileObj);
    profileObj = this.completeClassAccesses(profileObj);
    profileObj = this.completePageAccesses(profileObj);
    profileObj = this.completeRecordTypeVisibilities(profileObj);
    profileObj = this.completeLayoutAssignments(profileObj);
    profileObj = this.completeFieldPermissions(profileObj);

    return profileObj;
  }

  private completeObjects(profileObj: Profile): Profile {
    var objPerm = AcnProfileUtils.filterObjects(profileObj);

    if (objPerm === undefined) {
      //profileObj.objectPermissions = new Array();
      objPerm = new Array();
    }

    this.metadataFiles.objects.forEach(objectComponent => {

      var name = FileUtils.getFileNameWithoudExtension(objectComponent, configs.objectExtension);

      var objectIsPresent: boolean = false;

      for (var i = 0; i < objPerm.length; i++) {
        if (objPerm[i].object === name) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildObjPermArray(name);
        console.log(objToInsert);

        profileObj.objectPermissions.push(objToInsert);
      }

    });
    return profileObj;
  }


  private completeAppVisibilities(profileObj: Profile): Profile {
    var appVisibility = AcnProfileUtils.filterApplicationVisibility(profileObj);

    if (appVisibility === undefined) {
      profileObj.applicationVisibilities = new Array();
      appVisibility = new Array();
    }

    this.metadataFiles.apps.forEach(appComponent => {

      var name = FileUtils.getFileNameWithoudExtension(appComponent, configs.appExtension);
      var objectIsPresent: boolean = false;
      //var defaultAppAssigned : boolean;

      for (var i = 0; i < appVisibility.length; i++) {
        if (appVisibility[i].application === name) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildAppVisibilityObj(name);
        console.log(objToInsert);

        profileObj.applicationVisibilities.push(objToInsert);
      }

    });
    return profileObj;
  }

  private completeTabVisibilities(profileObj: Profile): Profile {
    var tabVisibilities = AcnProfileUtils.filterTabVisibility(profileObj);

    if (tabVisibilities === undefined) {
      profileObj.tabVisibilities = new Array();
      tabVisibilities = new Array();
    }

    this.metadataFiles.tabs.forEach(tabComponent => {

      var name = FileUtils.getFileNameWithoudExtension(tabComponent, configs.tabExtension);

      var objectIsPresent: boolean = false;

      for (var i = 0; i < tabVisibilities.length; i++) {
        if (tabVisibilities[i].tab === name) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildTabVisibilityObj(name);
        console.log(objToInsert);

        profileObj.tabVisibilities.push(objToInsert);
      }

    });
    return profileObj;
  }

  private completeClassAccesses(profileObj: Profile): Profile {
    var classAccesses = AcnProfileUtils.filterApexClassAccesses(profileObj);

    if (classAccesses === undefined) {
      profileObj.classAccesses = new Array();
      classAccesses = new Array();
    }

    this.metadataFiles.classes.forEach(classComponent => {

      var name = FileUtils.getFileNameWithoudExtension(classComponent, configs.classExtension);

      var objectIsPresent: boolean = false;

      for (var i = 0; i < classAccesses.length; i++) {
        if (classAccesses[i].apexClass === name) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildApexClassAccessObj(name);
        console.log(objToInsert);

        profileObj.classAccesses.push(objToInsert);
      }

    });
    return profileObj;
  }

  private completePageAccesses(profileObj: Profile): Profile {
    var pageAccesses = AcnProfileUtils.filterApexPageAccesses(profileObj);

    if (pageAccesses === undefined) {
      profileObj.pageAccesses = new Array();
      pageAccesses = new Array();
    }

    this.metadataFiles.pages.forEach(pageComponent => {

      var name = FileUtils.getFileNameWithoudExtension(pageComponent, configs.pageExtension);

      var objectIsPresent: boolean = false;

      for (var i = 0; i < pageAccesses.length; i++) {
        if (pageAccesses[i].apexPage === name) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildApexPageAccessObj(name);
        console.log(objToInsert);

        profileObj.pageAccesses.push(objToInsert);
      }

    });
    return profileObj;
  }

  private completeRecordTypeVisibilities(profileObj: Profile): Profile {
    var recordTypeVisibilities = AcnProfileUtils.filterRecordTypeVisibilities(profileObj);

    if (recordTypeVisibilities === undefined) {
      profileObj.recordTypeVisibilities = new Array();
      recordTypeVisibilities = new Array();
    }

    this.metadataFiles.recordTypes.forEach(recordTypeComponent => {
      var splitFilepath = recordTypeComponent.split(path.sep);
      var objectName = splitFilepath[splitFilepath.indexOf("objects") + 1];
      objectName = objectName.concat('.');


      var name = FileUtils.getFileNameWithoudExtension(recordTypeComponent, configs.recordTypeExtension);

      var objectIsPresent: boolean = false;
      var hasPersonAccountDefault: boolean = false;

      if (objectName === ('Account' || 'Contact')) {
        hasPersonAccountDefault = true;
      }

      for (var i = 0; i < recordTypeVisibilities.length; i++) {
        if (recordTypeVisibilities[i].recordType === objectName.concat(name)) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildRecordTypeVisibilityObj(objectName.concat(name), hasPersonAccountDefault);
        console.log(objToInsert);

        profileObj.recordTypeVisibilities.push(objToInsert);
      }

    });
    return profileObj;
  }

  private completeLayoutAssignments(profileObj: Profile): Profile {
    var layoutAssignments = AcnProfileUtils.filterLayoutAssignments(profileObj);

    if (layoutAssignments === undefined) {
      profileObj.layoutAssignments = new Array();
      layoutAssignments = new Array();
    }

    var recordTypeInfo = new Array();
    var recordTypesPerObject: Array<string> = new Array();


    this.metadataFiles.recordTypes.forEach(recordTypeComponent => {

      var recordTypeName = FileUtils.getFileNameWithoudExtension(recordTypeComponent, configs.recordTypeExtension);
      var splitFilepath = recordTypeComponent.split(path.sep);
      var objectName = splitFilepath[splitFilepath.indexOf("objects") + 1];

      if (recordTypeInfo[objectName] === undefined) {
        recordTypesPerObject = new Array();
      }

      recordTypesPerObject.push(objectName.concat('.' + recordTypeName));

      recordTypeInfo[objectName] = {
        recordTypeName: recordTypesPerObject,
      };

    });

    this.metadataFiles.layouts.forEach(layoutComponent => {

      var name = FileUtils.getFileNameWithoudExtension(layoutComponent, configs.layoutExtension);
      console.log('name: ' + name);

      var objectName = name.split('-')[0];
      //console.log(objectName);


      var objectIsPresent: boolean = false;
      var layoutAssignmentObject: string;

      var layoutIsPresent: boolean = false;
      var canHaveRecordTypes: boolean = false;
      var hasPageLayout: boolean = false;
      var hasMasterPageLayout: boolean = false;
      var hasRecordPageLayout: boolean = false;
      var recordTypesPresent: Array<String> = new Array();


      for (var i = 0; i < profileObj.layoutAssignments.length; i++) {

        //find out the object this layout belongs to 
        layoutAssignmentObject = profileObj.layoutAssignments[i].layout.split('-')[0];

        if (layoutAssignmentObject === objectName) {
          if (profileObj.layoutAssignments[i].layout === name) {
            if (recordTypeInfo[objectName] === undefined) {
              objectIsPresent = true;
              layoutIsPresent = true;
              hasPageLayout = true;
            } else {
              if (profileObj.layoutAssignments[i].recordType === undefined) {
                //name of layout is present, object can have record types but does not have one
                objectIsPresent = true;
                layoutIsPresent = true;
                canHaveRecordTypes = true;
                hasMasterPageLayout = true;
              } else {
                //name of layout is present, object can have record types and has one
                objectIsPresent = true;
                layoutIsPresent = true;
                canHaveRecordTypes = true;
                hasRecordPageLayout = true;
                recordTypesPresent.push(profileObj.layoutAssignments[i].recordType);
              }
            }
          } else {
            //object is present, has a different layout assigned           
            if (recordTypeInfo[objectName] === undefined) {
              objectIsPresent = true;
              hasPageLayout = true;
            } else {
              if (profileObj.layoutAssignments[i].recordType === undefined) {
                objectIsPresent = true;
                canHaveRecordTypes = true;
                hasMasterPageLayout = true;
              } else {
                objectIsPresent = true;
                canHaveRecordTypes = true;
                hasRecordPageLayout = true;
                recordTypesPresent.push(profileObj.layoutAssignments[i].recordType);
              }
            }
          }
        }
      }

      //What if there are multiple page layouts for a single object?
      //can only assign one page layout per object - excluding those with record types

      if (objectIsPresent === false) {
        if (layoutIsPresent === false) {
          var objToInsert = AcnProfileUtils.buildLayoutObj(name, '');
          console.log("\n Inserting this object");
          console.log(objToInsert);
          profileObj.layoutAssignments.push(objToInsert);
        }
      }
      else {
        //the object is present, cannot assign two layouts to the same object
        if (layoutIsPresent === false) {
          if (canHaveRecordTypes === true) {
            if (hasMasterPageLayout === true) {

              if (hasRecordPageLayout === false) {
                var recordName = recordTypeInfo[objectName].recordTypeName[0];
                var objToInsert = AcnProfileUtils.buildLayoutObj(name, recordName);
                console.log("\n Inserting this object");
                console.log(objToInsert);
                profileObj.layoutAssignments.push(objToInsert);
              } else {
                var numRecordsPresent = recordTypesPresent.length;
                if (numRecordsPresent < recordTypeInfo[objectName].recordTypeName.length) {
                  var diffArray = this.arrDiff(recordTypesPresent, recordTypeInfo[objectName].recordTypeName);
                  var objToInsert = AcnProfileUtils.buildLayoutObj(name, diffArray[0]);
                  console.log("\n Inserting this object");
                  console.log(objToInsert);
                  profileObj.layoutAssignments.push(objToInsert);
                }
              }
            } else {
              var objToInsert = AcnProfileUtils.buildLayoutObj(name, '');
              console.log("\n Inserting this object");
              console.log(objToInsert);
              profileObj.layoutAssignments.push(objToInsert);
            }

          }

        }
      }
    });


    var recordTypesPresent = new Array();
    var layoutsPresent = new Array();
    var recordsPerObject = new Array<String>();
    var layoutsPerObject = new Array<String>();

    profileObj.layoutAssignments.forEach(layoutComponent => {

      var object = layoutComponent.layout.split('-')[0];

      if (recordTypeInfo[object] !== undefined) {

        if (recordTypesPresent[object] === undefined) {
          recordsPerObject = new Array();
        }

        if (layoutsPresent[object] === undefined) {
          layoutsPerObject = new Array();
        }

        if (layoutComponent.recordType !== undefined) {
          recordsPerObject.push(layoutComponent.recordType);
        }
        layoutsPerObject.push(layoutComponent.layout);

        recordTypesPresent[object] = {
          recordTypeName: recordsPerObject
        };

        layoutsPresent[object] = {
          layoutName: layoutsPerObject
        };
      }

    });

    for (var objectName in recordTypeInfo) {

      if (recordTypeInfo[objectName].recordTypeName.length !== recordTypesPresent[objectName].recordTypeName.length) {
        var diffArray = this.arrDiff(recordTypeInfo[objectName].recordTypeName, recordTypesPresent[objectName].recordTypeName);
        var layout;

        for (var object in layoutsPresent) {
          if (object === objectName) {
            layout = layoutsPresent[object].layoutName[0];
            break;
          }
        }
        for (var i = 0; i < diffArray.length; i++) {
          var objToInsert = AcnProfileUtils.buildLayoutObj(layout, diffArray[i]);
          console.log("\n Inserting this object");
          console.log(objToInsert);
          profileObj.layoutAssignments.push(objToInsert);
        }

      }

    }
    return profileObj;
  }

  // to know the difference between two arrays
  private arrDiff(a1, a2) {
    var a = [];
    var diff = [];

    for (var i = 0; i < a1.length; i++) {
      a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
      if (a[a2[i]]) {
        delete a[a2[i]];
      } else {
        a[a2[i]] = true;
      }
    }

    for (var k in a) {
      diff.push(k);
    }

    return diff;
  }

  private completeFieldPermissions(profileObj: Profile): Profile {
    var fieldPermissions = AcnProfileUtils.filterFieldPermissions(profileObj);
    var fieldLevelSecurities = AcnProfileUtils.filterFieldLevelSecurities(profileObj);

    if (fieldPermissions === undefined) {
      profileObj.fieldPermissions = new Array();
      fieldPermissions = new Array();
    }
    if (fieldLevelSecurities === undefined) {
      profileObj.fieldLevelSecurities = new Array();
      fieldLevelSecurities = new Array();
    }

    this.metadataFiles.fields.forEach(fieldComponent => {
      console.log(fieldComponent);
      var splitName = fieldComponent.split(path.sep);
      var objectName = splitName[splitName.length - 3];
      var name = FileUtils.getFileNameWithoudExtension(fieldComponent, configs.fieldExtension);
      name = objectName.concat('.' + name);

      console.log('\n' + name);

      var objectIsPresent: boolean = false;
      //Permissions for required fields cannot be retrieved or deployed
      var fieldIsRequired: boolean = false;

      var fieldXml = fs.readFileSync(fieldComponent);
      xml2js.parseString(fieldXml, function (err: Error, result: any) {

        if (result.CustomField.required !== undefined) {
          var requiredAttribute = result.CustomField.required[0];
          console.log(result.CustomField.required[0]);
          if (requiredAttribute === 'true') {
            fieldIsRequired = true;
          } else {
            fieldIsRequired = false;
          }
        }
        else {
          var fieldType = result.CustomField.type[0];
          if (fieldType === 'MasterDetail') {
            //console.log('MasterDetail found');
            fieldIsRequired = true;
          }
        }

      });

      for (var i = 0; i < fieldPermissions.length; i++) {
        if (fieldPermissions[i].field === name) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false && fieldIsRequired === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildFieldPermObj(name);
        console.log(objToInsert);

        profileObj.fieldPermissions.push(objToInsert);
      }

    });

    this.metadataFiles.fields.forEach(fieldComponent => {
      console.log(fieldComponent);
      var splitName = fieldComponent.split(path.sep);
      var objectName = splitName[splitName.length - 3];
      var name = FileUtils.getFileNameWithoudExtension(fieldComponent, configs.fieldExtension);
      name = objectName.concat('.' + name);

      console.log('\n' + name);

      var objectIsPresent: boolean = false;
      //Permissions for required fields cannot be retrieved or deployed
      var fieldIsRequired: boolean = false;

      var fieldXml = fs.readFileSync(fieldComponent);
      xml2js.parseString(fieldXml, function (err: Error, result: any) {

        if (result.CustomField.required !== undefined) {
          var requiredAttribute = result.CustomField.required[0];
          console.log(result.CustomField.required[0]);
          if (requiredAttribute === 'true') {
            fieldIsRequired = true;
          } else {
            fieldIsRequired = false;
          }
        }
        else {
          var fieldType = result.CustomField.type[0];
          if (fieldType === 'MasterDetail') {
            //console.log('MasterDetail found');
            fieldIsRequired = true;
          }
        }

      });

      for (var i = 0; i < fieldLevelSecurities.length; i++) {
        if (fieldLevelSecurities[i].field === name) {
          objectIsPresent = true;
          break;
        } else {
          objectIsPresent = false;
        }
      }

      if (objectIsPresent === false && fieldIsRequired === false) {
        console.log("\n Inserting this object");
        var objToInsert = AcnProfileUtils.buildFieldPermObj(name);
        console.log(objToInsert);

        profileObj.fieldLevelSecurities.push(objToInsert);
      }

    });

    return profileObj;
  }


  private static filterObjects(profileObj: Profile): ProfileObjectPermissions[] {
    return profileObj.objectPermissions;
  }
  private static filterApplicationVisibility(profileObj: Profile): ProfileApplicationVisibility[] {
    return profileObj.applicationVisibilities;
  }
  private static filterTabVisibility(profileObj: Profile): ProfileTabVisibility[] {
    return profileObj.tabVisibilities;
  }
  private static filterApexClassAccesses(profileObj: Profile): ProfileApexClassAccess[] {
    return profileObj.classAccesses;
  }
  private static filterApexPageAccesses(profileObj: Profile): ProfileApexPageAccess[] {
    return profileObj.pageAccesses;
  }
  private static filterRecordTypeVisibilities(profileObj: Profile): ProfileRecordTypeVisibility[] {
    return profileObj.recordTypeVisibilities;
  }
  private static filterLayoutAssignments(profileObj: Profile): ProfileLayoutAssignments[] {
    return profileObj.layoutAssignments;
  }
  private static filterFieldPermissions(profileObj: Profile): ProfileFieldLevelSecurity[] {
    return profileObj.fieldPermissions;
  }
  private static filterFieldLevelSecurities(profileObj: Profile): ProfileFieldLevelSecurity[] {
    return profileObj.fieldLevelSecurities;
  }


  private static buildObjPermArray(objectName: string): ProfileObjectPermissions {
    var newObjPerm = {
      allowCreate: true,
      allowDelete: true,
      allowEdit: true,
      allowRead: true,
      modifyAllRecords: true,
      object: objectName,
      viewAllRecords: true
    };
    return newObjPerm;
  }
  private static buildAppVisibilityObj(appName: string): ProfileApplicationVisibility {
    var newAppObj = {
      application: appName,
      default: false,
      visible: true
    };
    return newAppObj;
  }
  private static buildTabVisibilityObj(tabName: string): ProfileTabVisibility {
    var newTabObj = {
      tab: tabName,
      visibility: TabVisibility.DefaultOn
    };
    return newTabObj;
  }
  private static buildFieldPermObj(fieldName: string): ProfileFieldLevelSecurity {
    var newFieldObj = {
      editable: true,
      field: fieldName,
      hidden: false,
      readable: true
    };
    return newFieldObj;
  }
  private static buildApexClassAccessObj(className: string): ProfileApexClassAccess {
    var newApexClassObj = {
      apexClass: className,
      enabled: true
    };
    return newApexClassObj;
  }
  private static buildApexPageAccessObj(pageName: string): ProfileApexPageAccess {
    var newApexPageObj = {
      apexPage: pageName,
      enabled: true
    };
    return newApexPageObj;
  }
  private static buildRecordTypeVisibilityObj(recordTypeName: string, hasPersonAccountDefault: boolean): ProfileRecordTypeVisibility {
    var newRecordTypeObj;

    if (hasPersonAccountDefault) {
      newRecordTypeObj = {
        default: false,
        personAccountDefault: false,
        recordType: recordTypeName,
        visible: true
      };
    }
    else {
      newRecordTypeObj = {
        default: false,
        recordType: recordTypeName,
        visible: true
      };
    }
    return newRecordTypeObj;
  }

  private static buildLayoutObj(layoutName: string, recordTypeName: string) {
    var newLayoutAssignment;
    if (recordTypeName === '') {
      newLayoutAssignment = {
        layout: layoutName
      };
    } else {
      newLayoutAssignment = {
        layout: layoutName,
        recordType: recordTypeName
      };
    }
    return newLayoutAssignment;
  }


}
