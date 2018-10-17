import {flags} from '@oclif/command';
import {core, SfdxCommand} from '@salesforce/command';

var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");


import { SfdxUtil } from '@salesforce/core';
import TestDataGenerator from '../../../utils/force/lib/testDataGenerator';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'testdataLoad');

export default class Load extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx testdataset:build --configfile data-config/data-strucure.json --outputfolder output --queryfolder queries --username sandbox
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    configfile : {char: 'f', description:messages.getMessage('dataConfigDescription'), required:true },
    outputfolder : {char:'d', description:messages.getMessage('outputFolderDescription'), required: true },
    queryfolder : {char:'q', description:messages.getMessage('queryFolderDescription'), required: true },
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  //protected static requiresProject = false;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    var me = this;
    
    const conn = this.org.getConnection();


    const queryFolder:string = this.flags.queryfolder;
    const outputFolder:string = this.flags.outputfolder;
    const configFile:string = this.flags.configfile;

    var structureDescription= await SfdxUtil.readJSON(configFile);

    //console.log(structureDescription);
    var generator=new TestDataGenerator(this.org, structureDescription as any[], queryFolder, outputFolder);

    var generated = await generator.generateData();
    //return generated;
    //console.log(generated);

    if(fs.existsSync(outputFolder) == false){
      fs.mkdirSync(outputFolder);
    }

    var outputPath = path.join(outputFolder, "test-data.json");
    SfdxUtil.writeJSON(outputPath, generated);
    return generated;

  }
}