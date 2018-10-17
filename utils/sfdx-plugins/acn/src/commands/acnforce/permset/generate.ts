import {flags} from '@oclif/command';
import {core, SfdxCommand} from '@salesforce/command';

var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");


import {sfdxConfigs as configs, AcnForce as acnForce} from './../../../utils';
import PermissionSet from '../../../utils/force/types/permissionSet';
import FileUtils from '../../../utils/lib/fsutils';
import AcnPermissionSetUtils from '../../../utils/force/lib/pemsetutils';
import AcnForceUtils from '../../../utils/force/lib/acnforce';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'permsetGenerate');

export default class Generate extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx acn:permset:generate --name PermissionSetName --folder force-app
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: { char: 'n', description: messages.getMessage('nameFlagDescription'), required: true },
    folder: { char: 'd', description: messages.getMessage('folderFlagDescription'), required: true }
  };

  // Comment this out if your command does not require an org username
  //protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  //protected static requiresProject = false;
  public async run(): Promise<any> { // tslint:disable-line:no-any
    const cmd: Generate = this;
    var permSetPath = "";

    const name = this.flags.name;
    const folder = this.flags.folder;
    var permissionSet:PermissionSet=null;
    var normalizedPath = path.join(process.cwd(), folder);
    this.ux.log("generating the permissionSet "+ name);

    var res=glob(normalizedPath + '/**/' + name + AcnForceUtils.permsetExtension, {sync:true});

    if (res == undefined || res.length == 0) {
      cmd.ux.log("The pemission does not exist. Creating one.");
      const permsetFolder = normalizedPath + path.sep + 'main' + path.sep + 'default' + path.sep + configs.permsetFolder + '/';
      permSetPath = permsetFolder + name + AcnForceUtils.permsetExtension;
      FileUtils.mkDirByPathSync(permsetFolder);
      configs.emptyPermSet.then((emptyPermSet: any) => {
        cmd.ux.log(emptyPermSet);
        var builder = new xml2js.Builder({ rootName: "PermissionSet" });
        var xml = builder.buildObject(emptyPermSet);
        try {
          fs.appendFileSync(permSetPath, xml);
          cmd.ux.log('Permission set created at ' + permSetPath);
          //Build permset
          permissionSet = AcnPermissionSetUtils.buildPermset(normalizedPath, permSetPath,  name);
        } catch (err) {
          /* Handle the error */
          cmd.ux.log(err);
          cmd.ux.error("Error creating the permission set " + permSetPath);
        }
      });
    }
    else {
      permSetPath = res[0];
      permissionSet = AcnPermissionSetUtils.buildPermset( normalizedPath, permSetPath,  name);
    }
    // Return an object to be displayed with --json
    return { "PermissionSet": permissionSet};
  }
}
