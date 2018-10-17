import {flags} from '@oclif/command';
import {core, SfdxCommand} from '@salesforce/command';

var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");

import AcnUtils from '../../../utils/lib/global';
import AcnProfileUtils from '../../../utils/force/lib/profileUtils';
import MetadataFiles from "../../../utils/force/lib/metadataFiles";

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'profileComplete');

export default class Complete extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx acnforce:profile:complete  --folder force-app
  `,
  `$ sfdx acnforce:profile:complete  --folder force-app,module2,module3/force-app
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    folder: { char: 'd', description: messages.getMessage('folderFlagDescription'), required: true },
    profile: { char: 'p', description: messages.getMessage('profileFlagDescription'), required: false}
  };

  // Comment this out if your command does not require an org username
  //protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  //protected static requiresProject = false;
  public async run(): Promise<any> { // tslint:disable-line:no-any

    const folder:string = this.flags.folder;
    var profile:string = this.flags.profile;

    var allProfiles:boolean = false;
    
    if(AcnUtils.isNull(profile) || profile===""){
        allProfiles = true;
    }

    var folders = folder.split(",");
    var profileUtils: AcnProfileUtils = new AcnProfileUtils();
    var completeProfiles = profileUtils.complete(folders, allProfiles, profile);

    return { "CompleteProfile": completeProfiles};
    //console.log(folders);
    //this.CompleteProfile(folders, allProfiles, profile);
  }



  
  

}
