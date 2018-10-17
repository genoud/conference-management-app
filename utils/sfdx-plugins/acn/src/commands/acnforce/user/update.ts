import {core, SfdxCommand} from '@salesforce/command';



import AcnFeatureUtils from '../../../utils/force/lib/featureUtils';
import { SuccessResult, ErrorResult } from 'jsforce/record-result';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'userUpdate');

export default class Update extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx acn:user:update --username username --field FieldName --value value
  `
  ];


  protected static flagsConfig = {
    field: { char: 'f', description: messages.getMessage('fieldNameDescription'), required: true },
    value: { char: 'v', description: messages.getMessage('valueDescription'), required: true },
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  //protected static requiresProject = false;
  public async run(): Promise<any> { // tslint:disable-line:no-any

    var me=this;
    var conn=this.org.getConnection();
    
    const fieldName: string = this.flags.field;
    const value: string = this.flags.value;

   
    var userName=this.org.getMetaInfo().info.getFields().username;
    
    const query = "Select Id, Name from User WHERE username='" + userName + "'";

    // Query the org
    const result = await conn.query<any>(query);

    var userId = result.records[0].Id;
    var name = result.records[0].Name;

    var userObject={
      Id: userId
    };
    userObject[fieldName]=value;
    var recordResult = await conn.sobject("User").update(userObject);

    if(recordResult.success){
      var success=recordResult as SuccessResult;
      me.log('Field '+ fieldName +' updated for user   : ' + userName + " With Id: "+ success.id);
    }
    else{
      var err=recordResult as ErrorResult;
      this.error(err.errors.join(" | "));
    }
    return { };
  }
}
