import {flags} from '@oclif/command';
import {core, SfdxCommand} from '@salesforce/command';

var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");

import AcnUtils from '../../../utils/lib/global';
import {sfdxConfigs as configs, AcnForce as acnForce} from './../../../utils';
import PermissionSet from '../../../utils/force/types/permissionSet';
import FileUtils from '../../../utils/lib/fsutils';
import AcnPermissionSetUtils from '../../../utils/force/lib/pemsetutils';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'permsetComplete');

export default class Complete extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx acnforce:permset:complete  --folder force-app
  `,
  `$ sfdx acnforce:permset:complete  --folder force-app,module2,module3/force-app
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    folder: { char: 'd', description: messages.getMessage('folderFlagDescription'), required: true },
    permset: { char: 'p', description: messages.getMessage('nameFlagDescription'), required: false}
  };

  // Comment this out if your command does not require an org username
  //protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  //protected static requiresProject = false;
  public async run(): Promise<any> { // tslint:disable-line:no-any

    const folder:string = this.flags.folder;
    var permset:string = this.flags.permset;

    var allPermsets:boolean = false;
    
    if(AcnUtils.isNull(permset) || permset===""){
        allPermsets = true;
    }

    var folders = folder.split(",");
    var completePermsets = AcnPermissionSetUtils.complete(folders, allPermsets, permset);

    return { "CompletePermset": completePermsets};

  }



  
  

}
