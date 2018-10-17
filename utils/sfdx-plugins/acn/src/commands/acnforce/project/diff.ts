import {flags} from '@oclif/command';
import {core, SfdxCommand} from '@salesforce/command';


var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");

import AcnUtils from '../../../utils/lib/global';
import FileUtils from '../../../utils/lib/fsutils';
import ISfdxConfigs from "../../../utils/force/lib/global";
import DiffUtil from '../../../utils/lib/diffutils';
const configs = require('../../../utils/force/lib/global') as ISfdxConfigs;


// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'projectDiff');



export default class Diff extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx acnforce:project:diff --diffFile DiffFileName --encoding EncodingOfFile --output OutputFolder
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    difffile : {char: 'f', description:messages.getMessage('diffFileDescription'), required:true },
    encoding : {char:'e', description:messages.getMessage('encodingDescription'), required: false },
    output : {char:'d', description:messages.getMessage('outputFolderDescription'), required: true }
  };

  public async run(): Promise<any> { // tslint:disable-line:no-any

    const diffFile:string = this.flags.difffile;
    var encoding:string = this.flags.encoding;
    const outputFolder:string = this.flags.output;
    if(AcnUtils.isNull(encoding) || encoding===""){
      encoding="utf8";
    }
 
    /* PATH TO DIFF FILE */
    var diffFilePath = path.join(process.cwd(), diffFile);
    var fileContents = FileUtils.readAndSplitFile(diffFilePath, encoding);

    var diffUtils= new DiffUtil();
    var diffOutput=diffUtils.build(diffFilePath, encoding, outputFolder);

    if(!AcnUtils.isNull(diffOutput.addedEdited) && diffOutput.addedEdited.length>0){
      this.ux.log("Edited or added files: "+ diffOutput.addedEdited.length);
      this.ux.log("");
      for(var i=0; i<diffOutput.addedEdited.length; i++){
        this.ux.log(diffOutput.addedEdited[i]);
      }
    }
    console.log("####################################################");
    if(!AcnUtils.isNull(diffOutput.deleted) && diffOutput.deleted.length>0){
      this.ux.log("Deleted files: "+ diffOutput.deleted.length);
      this.ux.log("");
      for(var i=0; i<diffOutput.deleted.length; i++){
        this.ux.log(diffOutput.deleted[i]);
      }
    }
    
    return diffOutput;

  }
}