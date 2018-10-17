import { flags } from '@oclif/command';
import { core, SfdxCommand } from '@salesforce/command';

var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");


import { SfdxUtil } from '@salesforce/core';
import AcnRecordTypeUtils, { RecordType } from '../../../utils/force/lib/recordTypeUtils';
import AcnUtils from '../../../utils/lib/global';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'testdataGenerate');

export default class Generate extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx testdataset:generate --sample SampleFolderName --output OutputFolderName
  `
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    sample: { char: 's', description: messages.getMessage('sampleFolderDescription'), required: true },
    output: { char: 'd', description: messages.getMessage('outputFolderDescription'), required: true },
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  //protected static requiresProject = false;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    var me = this;
    const recordTypeUtils = new AcnRecordTypeUtils(this.org);
    const recordTypes = await recordTypeUtils.getRecordType();


    const sampleFolder: string = this.flags.sample;
    const outputFolder: string = this.flags.output;


    /* PATH TO SAMPLE FOLDER */
    var sampleFolderPath = path.join(process.cwd(), sampleFolder);

    this.GenerateRecordTypes(sampleFolderPath, outputFolder, me, recordTypes);
  }

  /* FUNCTION TO GET RECORD TYPE ID GIVEN DEVELOPER NAME AND SOBJECTTYPE */
  public getRecordTypeIdByDeveloperName(SobjectType, developerName, recordTypes: RecordType[]) {
    if (recordTypes === null || recordTypes === undefined) {
      recordTypes = [];
    }
    for (var i = 0; i < recordTypes.length; i++) {
      if (recordTypes[i].DeveloperName == developerName && recordTypes[i].SobjectType == SobjectType) {
        return recordTypes[i].Id;
      }
    }
    return "";

  }

  /* FUNCTION TO TRAVERSE DIRECTORY, CREATE SUBFOLDERS AND GENERATE NEW FILES */
  public GenerateRecordTypes(directory, outputFolder, me, recordTypes) {

    var files = fs.readdirSync(directory);

    if (fs.existsSync(outputFolder) == false) {
      fs.mkdirSync(outputFolder);
    }
    files.forEach(file => {
      var filepath = path.join(directory, file);
      var outputPath = path.join(outputFolder, file);

      if (fs.lstatSync(filepath).isDirectory() == true) {
        this.GenerateRecordTypes(filepath, outputPath, me, recordTypes);
      } else {
        var contents = fs.readFileSync(filepath);
        var obj = JSON.parse(contents);

        if(AcnUtils.isNotNull(obj.records)){
          obj.records.forEach(element => {
            var recordTypeDeveloperName = "";
            
            if (AcnUtils.isNull(element.RecordTypeId)) {
              
              var recordTypeObj = element.RecordType;
              if (AcnUtils.isNotNull(recordTypeObj)) {
                recordTypeDeveloperName = recordTypeObj.DeveloperName;
                delete element.RecordType;
              }
            }
            else {
              recordTypeDeveloperName = element.RecordTypeId;
            }
            if (AcnUtils.isNotNull(recordTypeDeveloperName) && recordTypeDeveloperName !== "") {
              var recordTypeId=me.getRecordTypeIdByDeveloperName(element.attributes.type, recordTypeDeveloperName, recordTypes);
              element.RecordTypeId = recordTypeId;
            }
            else {
              delete element.RecordTypeId;
            }
  
          });
        }
        
        var newFilePath = path.join(process.cwd(), outputPath);
        SfdxUtil.writeJSON(newFilePath, obj);
      }
    });
  }

}