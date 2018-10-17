import {flags} from '@oclif/command';
import {core, SfdxCommand} from '@salesforce/command';

var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");

import AcnUtils from '../../../utils/lib/global';
import {sfdxConfigs as configs, AcnForce as acnForce} from '../../../utils';
import PermissionSet from '../../../utils/force/types/permissionSet';
import FileUtils from '../../../utils/lib/fsutils';
import AcnPermissionSetUtils from '../../../utils/force/lib/pemsetutils';
import { MetadataInfo } from 'jsforce';
import AcnProfileUtils from '../../../utils/force/lib/profileUtils';
import { SfdxProjectJson } from '@salesforce/core';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'permsetSync');

export default class Sync extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx acnforce:permset:sync  
  `,
  `$ sfdx acnforce:permset:sync -f "module1, module2, module3" -p "My Custom permission set" -r 
  `,
  `$ sfdx acnforce:permset:sync -f "module1, module2, module3" -p "My Custom permission set 1, My Custom pemission set 2" -r 
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    folder: { char: 'd', description: messages.getMessage('folderFlagDescription'), required: false },
    permsetlist: { char: 'p', description: messages.getMessage('permissionSetListFlagDescription'), required: false},
    noreconcile: flags.boolean({ char: 'n', description: messages.getMessage('noreconcileFlagDescription'), required: false})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;
  public async run(): Promise<any> { // tslint:disable-line:no-any

    var argFolder:string = this.flags.folder;
    var argProfileList:string = this.flags.profilelist;
    var reconcile = this.flags.noreconcile? false:true;

    var profileList:string[]=[];
    if(AcnUtils.isNull(argProfileList) || argProfileList===""){
      profileList=[];
    }
    else{
      profileList=argProfileList.split(",");
      profileList= profileList.map(element=>{
        return element.trim();
      });
    }

    var folders:string[]=[];
    if(AcnUtils.isNull(argFolder) || argFolder===""){
      const project = await SfdxProjectJson.retrieve<SfdxProjectJson>();

      var plugins = project.get("plugins");
      var acnPlugin = plugins["acn"];
      var modules = acnPlugin["modules"];
      modules.forEach(element => {
        if(!element.excludeReconcile){
          folders.push(element.path);
        }
      });
    }
    else{
      folders=argFolder.split(",");
      folders= folders.map(element=>{
        return element.trim();
      });
    }


    var conn= this.org.getConnection();
    
    var profileUtils=new AcnProfileUtils();
   
    
    var syncPofles = await profileUtils.sync(folders, conn, reconcile, profileList);

    return syncPofles;

  }



  
  

}
