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

// NON ARRAY PROPERTIES
const nonArayProperties = ["$", 'name', 'fullName', 'accessType', 'publicFolderAccess'];

const documentFolderExtension = '.documentFolder-meta.xml';
const emailFolderExtension = '.emailFolder-meta.xml';
const reportFolderExtension = '.reportFolder-meta.xml';
const dashboardFolderExtension = '.dashboardFolder-meta.xml';

export default class AcnFolderUtils {

  public static removeUsers(srcFolders: string[]){
    srcFolders.forEach(srcFolder => {
        var normalizedPath = path.join(process.cwd(), srcFolder);
        console.log(normalizedPath);
        var allFiles = FileUtils.getAllFilesSync(srcFolder);
        allFiles.forEach(filePath => {
            var splitFilePath = filePath.split(path.sep);
            var lastIndex = splitFilePath.length - 1;
            var filename = splitFilePath[lastIndex];
            if(filename.endsWith(documentFolderExtension)){
                AcnFolderUtils.removeReferenceInDocument(filePath);
            }
            if(filename.endsWith(emailFolderExtension)){
                AcnFolderUtils.removeReferenceInEmail(filePath);
            }
            if(filename.endsWith(reportFolderExtension)){
                AcnFolderUtils.removeReferenceInReport(filePath);
            }
            if(filename.endsWith(dashboardFolderExtension)){
                AcnFolderUtils.removeReferenceInDashboard(filePath);
            }            
        });
    });
  }

  private static removeReferenceInDocument(filePath:string){
    var documentXml = fs.readFileSync(filePath);
    var documentObj;
    xml2js.parseString (documentXml, function(err: Error, result:any){
        documentObj = AcnFolderUtils.toFolder(result.DocumentFolder);
        AcnFolderUtils.removeReferenceToUsers(documentObj);
        var builder = new xml2js.Builder({ rootName: 'DocumentFolder' });
        var xml = builder.buildObject(documentObj);
        fs.writeFileSync(filePath, xml); 
    });
  }
  
  private static removeReferenceInEmail(filePath:string){
    var emailXml = fs.readFileSync(filePath);
    var emailObj;
    xml2js.parseString (emailXml, function(err: Error, result:any){
        emailObj = AcnFolderUtils.toFolder(result.EmailFolder);
        AcnFolderUtils.removeReferenceToUsers(emailObj);
        var builder = new xml2js.Builder({ rootName: 'EmailFolder' });
        var xml = builder.buildObject(emailObj);
        fs.writeFileSync(filePath, xml); 
    }); 
  }

  private static removeReferenceInReport(filePath:string){
    var reportXml = fs.readFileSync(filePath);
    var reportObj;
    xml2js.parseString (reportXml, function(err: Error, result:any){
        reportObj = AcnFolderUtils.toFolder(result.ReportFolder);
        AcnFolderUtils.removeReferenceToUsers(reportObj);
        var builder = new xml2js.Builder({ rootName: 'ReportFolder' });
        var xml = builder.buildObject(reportObj);
        fs.writeFileSync(filePath, xml); 
    });    
  }

  private static removeReferenceInDashboard(filePath:string){
    var dashboardXml = fs.readFileSync(filePath);
    var dashboardObj;
    xml2js.parseString(dashboardXml, function(err: Error, result:any){
        dashboardObj = AcnFolderUtils.toFolder(result.DashboardFolder);
        AcnFolderUtils.removeReferenceToUsers(dashboardObj);
        var builder = new xml2js.Builder({ rootName: 'DashboardFolder' });
        var xml = builder.buildObject(dashboardObj);
        fs.writeFileSync(filePath, xml);
    });
  }

  private static removeReferenceToUsers(folderObj){    
     if(folderObj.folderShares !== undefined){
       for(var i=0; i<folderObj.folderShares.length; i++){
        if(folderObj.folderShares[i].sharedToType === 'User'){
          delete folderObj.folderShares[i];
        }
       }
    } 
  }

  private static toFolder(folderObj: any){
    var convertedObject: any = {};
    for (var key in folderObj) {
      if (Array.isArray(folderObj[key])) {
        //All top element must be arays exept non arrayProperties
        if (nonArayProperties.includes(key)) {
          convertedObject[key] = folderObj[key][0] === 'true' ? true :
          folderObj[key][0] === 'false' ? false :
          folderObj[key][0];
        }
        else {
          var data = [];
          for (var i = 0; i < folderObj[key].length; i++) {
            var element = AcnProfileUtils.removeArrayNatureOnValue(folderObj[key][i]);
            data.push(element);
          }
          convertedObject[key] = data;
        }
      }
      else if (nonArayProperties.includes(key)) {
        convertedObject[key] = folderObj[key];
      }
    }
    return convertedObject;
  }
}

