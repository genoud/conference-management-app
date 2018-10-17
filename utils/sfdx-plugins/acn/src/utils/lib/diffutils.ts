import FileUtils from './fsutils';
import ISfdxConfigs from '../force/lib/global';
import AcnUtils from './global';
const configs = require('../force/lib/global') as ISfdxConfigs;


var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");
var copydir = require('copy-dir');


const pairStatResources = 'staticresources';
const pairStatResourcesRegExp = new RegExp(pairStatResources);
const pairAuaraRegExp = new RegExp('aura');

export interface DiffFile{
  deleted:string[];
  addedEdited:string[];
}
export default class DiffUtil{

  public build(diffFilePath:string, encoding:string, outputFolder:string):DiffFile{
    //const sepRegex=/\t| |\n/;
    const sepRegex=/\n|\r/;
    var data = fs.readFileSync(diffFilePath, encoding);
    var content = data.split(sepRegex);
    var diffFile:DiffFile = this.parseContent(content);
    var filesToCopy=diffFile.addedEdited;
    var deletedFiles=diffFile.deleted;
    if(!AcnUtils.isNull(filesToCopy) && filesToCopy.length>0){
      for(var i=0; i<filesToCopy.length; i++){
        this.copyFile(filesToCopy[i], outputFolder);
      }
    }
    if(!AcnUtils.isNull(deletedFiles) && deletedFiles.length>0){
      this.createDestructiveChanges(deletedFiles, outputFolder);
    }

    return diffFile;

  }
  public parseContent(fileContents):DiffFile{
    //const startRegEx = /^:|^$/;
    //const statusRegEx = /^[A]$|^[M]$/;
    const statusRegEx = /\sA\t|\sM\t|\sD\t/;
    const renamedRegEx = /\sR[0-9]{3}\t|\sC[0-9]{3}\t/;
    const tabRegEx = /\t/;
    const deletedFileRegEx = new RegExp(/\sD\t/);
    const lineBreakRegEx = /\r?\n|\r|( $)/;

    var diffFile: DiffFile ={
      deleted:[],
      addedEdited:[]
    };

    for (var i = 0; i < fileContents.length; i++) {
      if (statusRegEx.test(fileContents[i]) ) {

        var lineParts= fileContents[i].split(statusRegEx);

        var finalPath=path.join(".", lineParts[1].replace(lineBreakRegEx, ""));
        finalPath=finalPath.trim();
        finalPath=finalPath.replace("\\303\\251", "é");
        
        if(deletedFileRegEx.test(fileContents[i]) ){ //Deleted
          diffFile.deleted.push(finalPath);
        }
        else{// Added or edited
          diffFile.addedEdited.push(finalPath);
        }
        
      }
      else if(renamedRegEx.test(fileContents[i])){

        var lineParts= fileContents[i].split(renamedRegEx);

        var pathsParts=path.join(".", lineParts[1].trim());
        pathsParts=pathsParts.replace("\\303\\251", "é");

        var paths=pathsParts.split(tabRegEx);
        var finalPath=paths[1];

        diffFile.addedEdited.push(finalPath);

      }
      
    }
    return diffFile;
  }

  public copyFile(filePath:string, outputFolder:string){
    var copyOutputFolder=outputFolder;
    if(filePath.startsWith(".")){
      return;
    }

    var exists = fs.existsSync(path.join(outputFolder, filePath));
    if(exists){
      return;
    }

    var filePathParts=filePath.split(path.sep);
    
    if(fs.existsSync(outputFolder) == false){
      fs.mkdirSync(outputFolder); 
    } 
    for(var i=0;i<filePathParts.length-1;i++){
      var folder=filePathParts[i].replace('"', '');
      outputFolder=path.join(outputFolder, folder);
      if(fs.existsSync(outputFolder) == false){
        fs.mkdirSync(outputFolder); 
      } 
    }

    

    var fileName=filePathParts[filePathParts.length-1].replace('"', '');

    var pattern=fileName.split(".")[0];
    pattern = pattern+".*";
    var associatedFilePattern= filePath.replace(fileName, pattern);
    var files= glob.sync(associatedFilePattern);
    for(var i=0;i<files.length; i++){
      if(fs.lstatSync(files[i]).isDirectory() == false){
        var oneFilePath=path.join(".", files[i]);
        var oneFilePathParts=oneFilePath.split(path.sep);
        fileName=oneFilePathParts[oneFilePathParts.length-1];
        var outputPath=path.join(outputFolder, fileName);
        fs.copyFileSync(files[i], outputPath);
      }
    }

    if(filePath.endsWith("Translation-meta.xml") && filePath.indexOf("globalValueSet")<0){
      var parentFolder=filePathParts[filePathParts.length-2];
      var objectTranslation=parentFolder+".objectTranslation-meta.xml";
      var outputPath=path.join(outputFolder, objectTranslation);
      var sourceFile=filePath.replace(fileName, objectTranslation);
      if(fs.existsSync(sourceFile) == true){
        fs.copyFileSync(sourceFile, outputPath);
      } 
    }

    //FOR STATIC RESOURCES - WHERE THE CORRESPONDING DIRECTORY + THE ROOT META FILE HAS TO BE RETRIEVED
    if(pairStatResourcesRegExp.test(filePath)){           
      outputFolder=path.join(".", copyOutputFolder);
      var srcFolder='.';
      var staticRecourceRoot="";
      var resourceFile="";
      for(var i=0; i<filePathParts.length; i++){
        outputFolder=path.join(outputFolder, filePathParts[i]);
        srcFolder=path.join(srcFolder, filePathParts[i]);
        if(filePathParts[i] === 'staticresources'){
          
          var fileOrDirname=filePathParts[i+1];
          var fileOrDirnameParts=fileOrDirname.split(".");
          srcFolder=path.join(srcFolder, fileOrDirnameParts[0]);
          outputFolder=path.join(outputFolder, fileOrDirnameParts[0]);
          resourceFile=srcFolder+".resource-meta.xml";
          staticRecourceRoot=outputFolder+".resource-meta.xml";
          if(fs.existsSync(srcFolder)){
            if(fs.existsSync(outputFolder) == false){
              fs.mkdirSync(outputFolder); 
            } 
          }
          break;
        }
      }
      if(fs.existsSync(srcFolder)){
        copydir.sync(srcFolder, outputFolder); 
      }
      if(fs.existsSync(resourceFile)){
        fs.copyFileSync(resourceFile, staticRecourceRoot);
      }
      
    }
    //FOR AURA components
    if(pairAuaraRegExp.test(filePath)){           
      outputFolder=path.join(".", copyOutputFolder);
      var srcFolder='.';
      for(var i=0; i<filePathParts.length; i++){
        outputFolder=path.join(outputFolder, filePathParts[i]);
        srcFolder=path.join(srcFolder, filePathParts[i]);
        if(filePathParts[i] === 'aura'){
          
          var fileOrDirname=filePathParts[i+1];
          var fileOrDirnameParts=fileOrDirname.split(".");
          srcFolder=path.join(srcFolder, fileOrDirnameParts[0]);
          outputFolder=path.join(outputFolder, fileOrDirnameParts[0]);
          
          if(fs.existsSync(srcFolder)){
            if(fs.existsSync(outputFolder) == false){
              fs.mkdirSync(outputFolder); 
            } 
          }
          break;
        }
      }
      if(fs.existsSync(srcFolder)){
        copydir.sync(srcFolder, outputFolder); 
      }
      
    }
  }

  public createDestructiveChanges(filePaths: string[], outputFolder:string){
    var destrucObj = new Array();
    //returns root, dir, base and name
    for(var i=0;i<filePaths.length;i++){
      var filePath=filePaths[i];
      var parsedPath = path.parse(filePath);
      var filename = parsedPath.base;      
      var name = this.getNameOfTypes(filename);
      if(!AcnUtils.isNull(name)){
        var member = this.getMemberNameFromFilepath(filePath, name); 
        destrucObj = this.buildDestructiveTypeObj(destrucObj, name, member);
      }
      
    }

    if(destrucObj.length>0){
      var dest={
        Package:{
          '$':{
            xmlns: 'http://soap.sforce.com/2006/04/metadata'
          },
          types: destrucObj
        }
      }
  
      var destructivePackageName = 'destructiveChanges.xml';
      var filepath = path.join(outputFolder, destructivePackageName);
      var builder = new xml2js.Builder();
      var xml = builder.buildObject(dest);
      fs.writeFileSync(filepath, xml);
    }
    
  }
  

  

  
  

  //Determine the name based on the filename, for example, apexClass, customObject etc
  //NEED TO TAKE INTO CONSIDERATION OTHER TYPES AS WELL, FOR E.G, OBJECT TRANSLATIONS - NOT COMPLETED
  public  getNameOfTypes(filename:string):string{
    var name:string;
    if(filename.endsWith('.settings-meta.xml')){
      name = 'AccountSettings';
      return name;
    }
    if(filename.endsWith('.actionLinkGroupTemplate-meta.xml')){
      name = 'ActionLinkGroupTemplate';
      return name;
    }
    if(filename.endsWith(configs.classExtension)){
      name = 'ApexClass';
      return name;
    }
    if(filename.endsWith('.component-meta.xml')){
      name = 'ApexComponent';
      return name;
    }
    if(filename.endsWith(configs.pageExtension)){
      name = 'ApexPage';
      return name;
    }
    if(filename.endsWith('.trigger-meta.xml')){
      name = 'ApexTrigger';
      return name;
    }  
    if(filename.endsWith('.approvalProcess-meta.xml')){
      name = 'ApprovalProcess';
      return name;
    }
    if(filename.endsWith('.assignmentRules-meta.xml')){
      name = 'AssignmentRules';
      return name;
    }
    if(filename.endsWith('.authProvider-meta.xml')){
      name = 'AuthProvider';
      return name;
    }
    if(filename.endsWith(configs.appExtension)){
      name = 'CustomApplication';
      return name;
    }
    if(filename.endsWith('.customApplicationComponent-meta.xml')){
      name = 'CustomApplicationComponent';
      return name;
    }
    if(filename.endsWith(configs.objectExtension)){
      name = 'CustomObject';
      return name;
    }
    if(filename.endsWith('.field-meta.xml')){
      name = 'CustomField';
      return name;
    }
    if(filename.endsWith('.listView-meta.xml')){
      name = 'ListView';
      return name;
    }
    if(filename.endsWith('.validationRule-meta.xml')){
      name = 'ValidationRule';
      return name;
    }
    if(filename.endsWith(configs.tabExtension)){
      name = 'CustomTab';
      return name;
    }
    if(filename.endsWith('.dashboard-meta.xml')){
      name = 'Dashboard';
      return name;
    }
    if(filename.endsWith('.document-meta.xml')){
      name = 'Document';
      return name;
    }
    if(filename.endsWith('.email-meta.xml')){
      name = 'EmailTemplate';
      return name;
    }
    if(filename.endsWith('.delegateGroup-meta.xml')){
      name = 'DelegateGroup';
      return name;
    }
    if(filename.endsWith('.duplicateRule-meta.xml')){
      name = 'DuplicateRule';
      return name;
    }
    if(filename.endsWith('.objectTranslation-meta.xml')){
      name = 'CustomObjectTranslation';
      return name;
    }
    if(filename.endsWith('.recordType-meta.xml')){
      name = 'RecordType';
      return name;
    }
    if(filename.endsWith('.layout-meta.xml')){
      name = 'Layout';
      return name;
    }
    if(filename.endsWith('.report-meta.xml')){
      name = 'Report';
      return name;
    }
    if(filename.endsWith('.resource-meta.xml')){
      name = 'StaticResource';
      return name;
    }
    if(filename.endsWith('.translations-meta.xml')){
      name = 'Translations';
      return name;
    }
    if(filename.endsWith('.role-meta.xml')){
      name = 'Role';
      return name;
    }
  }

  public  getMemberNameFromFilepath(filepath:string, name:string):string{
    var member:string;
    var splitFilepath = filepath.split(path.sep);
    var lastIndex = splitFilepath.length - 1;
    if(name === 'CustomField' || name === 'RecordType' || name === 'ListView' || name === 'ValidationRule'){
      var objectName = splitFilepath[lastIndex-2];
      var fieldName = splitFilepath[lastIndex].split('.')[0];
      member = objectName.concat('.' + fieldName);
    }
    else if(name === 'Dashboard' || name === 'Document' || name === 'EmailTemplate' || name === 'Report'){
      var prefix = splitFilepath[lastIndex-1];
      var suffix = splitFilepath[lastIndex].split('.')[0];
      member = prefix.concat('/' + suffix);
    }
    // Add exceptions for member names that need to be treated differently using else if
    else{
      member = splitFilepath[lastIndex].split('.')[0];
    }
    return member;
  }

  private  buildDestructiveTypeObj(destructiveObj, name, member){
    var typeIsPresent:boolean = false;
    var typeIofIndex:number;
    var typeObj = destructiveObj;
    for(var i=0; i<typeObj.length; i++){
      for(var j=0; j<typeObj[i].length; j++){
        if((typeObj[i])[j].name === name){
          typeIsPresent = true;
          typeIofIndex = i;
          break;
        }
      }
    }
    var typeArray;
    if(typeIsPresent === false){
      typeArray = new Array();
      var buildNameObj = {
        name: name,
      };
      var buildMemberObj = {
        members: member
      }
      typeArray.push(buildNameObj);
      typeArray.push(buildMemberObj);
      destructiveObj.push(typeArray);  
    }
    else{
      var typeArrayInObj = destructiveObj[typeIofIndex];
      var buildMemberObj = {
        members: member
      };
      typeArrayInObj.push(buildMemberObj);
    }
    return destructiveObj;
  }

}