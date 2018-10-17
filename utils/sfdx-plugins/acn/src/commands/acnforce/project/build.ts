import { flags } from '@oclif/command';
import { core, SfdxCommand } from '@salesforce/command';

var xml2js = require('xml2js');
var path = require("path");
var fs = require("fs");
var glob = require("glob");


import FileUtils from '../../../utils/lib/fsutils';
import { SfdxUtil, Project, SfdxProjectJson } from '@salesforce/core';
import AcnUtils from '../../../utils/lib/global';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('acn', 'projectBuild');

export default class Build extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx project:build -d build-dir
  `
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    dest: { char: 'd', description: messages.getMessage('outputFolderDescription'), required: true },
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  //protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  static modules = [];

  public async run(): Promise<any> { // tslint:disable-line:no-any
    var me = this;

    //const conn = this.org.getConnection();


    const dest: string = this.flags.dest;

    const project = await SfdxProjectJson.retrieve<SfdxProjectJson>();

    //var project= await Project.resolve();
    //const projectJson = await project.resolveProjectConfig();

    var projectDirectories = project.get("packageDirectories");

    var plugins = project.get("plugins");
    var acnPlugin = plugins["acn"];
    Build.modules = acnPlugin["modules"];

    var exists = fs.existsSync(dest);
    if (!exists) {
      fs.mkdirSync(dest);
    }
    else {
      var stats = fs.statSync(dest);
      var isDirectory = stats.isDirectory();
      if (!isDirectory) {
        this.error("Invalid parameter. Folder required");
      }
    }

    for (var i = 0; i < Build.modules.length; i++) {

      this.buildModule(Build.modules[i].name, dest);
    }

    //FileUtils.copyRecursiveSync(src, dest);

  }

  private buildModule(moduleName, buildDir) {
    var moduleConfig = this.getModuleConfig(moduleName);
    if (AcnUtils.isNotNull(moduleConfig) && moduleConfig.built) {
      return;
    }
    for (var i = 0; i < moduleConfig.dependencies.length; i++) {
      this.buildModule(moduleConfig.dependencies[i], buildDir);
    }
    var modulePath = moduleConfig.path;
    //this.log(modulePath);
    //improve this code by reading the project.json file to retrieve the source folder 
    //instead of hard coding force-app folder
    FileUtils.copyRecursiveSync(modulePath + path.sep + "force-app", buildDir + path.sep + moduleName);

    this.moveMetadataToChildModules(moduleConfig, buildDir, "objects");
    this.moveMetadataToChildModules(moduleConfig, buildDir, "workflows");
    this.moveMetadataToChildModules(moduleConfig, buildDir, "layouts");
    this.moveMetadataToChildModules(moduleConfig, buildDir, "sharingRules");
    this.moveMetadataToChildModules(moduleConfig, buildDir, "assignmentRules");
    this.moveMetadataToChildModules(moduleConfig, buildDir, "reportTypes");
    //this.moveWorkflowMetadataToChildModules(moduleConfig, buildDir);
    moduleConfig.built = true;

  }

  private moveMetadataToChildModules(moduleConfig, buildDir, metadataFolder,  parentObjectPath?: string[]) {
    if (parentObjectPath === undefined || parentObjectPath === null) {
      parentObjectPath = [];
    }
    var objectPath = FileUtils.getFolderPath(buildDir + path.sep + moduleConfig.name, metadataFolder);
    var dependencyHasObjects = false;
    for (var i = 0; i < moduleConfig.dependencies.length; i++) {
      var dependencyConfig = this.getModuleConfig(moduleConfig.dependencies[i]);
      var dependencyModulePath = buildDir + path.sep + moduleConfig.dependencies[i];
      var dependencyObjectPath = FileUtils.getFolderPath(dependencyModulePath, metadataFolder);
      if (dependencyObjectPath !== "" && (objectPath !== "" || parentObjectPath.length>0)) {
        FileUtils.copyRecursiveSync(objectPath, dependencyObjectPath);
        parentObjectPath.forEach(parentpath => {
          FileUtils.copyRecursiveSync(parentpath, dependencyObjectPath);
        });
        this.moveMetadataToChildModules(dependencyConfig, buildDir, metadataFolder);
        dependencyHasObjects = true;
      }
      else {
        if (objectPath !== "") {
          parentObjectPath.push(objectPath);
        }
        if (parentObjectPath.length > 0) {
          dependencyHasObjects = this.moveMetadataToChildModules(dependencyConfig, buildDir, metadataFolder, parentObjectPath);
        }
      }
    }
    if (dependencyHasObjects && objectPath !== "") {
      FileUtils.deleteFolderRecursive(objectPath);
    }
    return dependencyHasObjects;
  }

  private hasObjectsDefinition(moduleName) {
    var moduleConfig = this.getModuleConfig(moduleName);
    var modulePath = moduleConfig.path;

  }

  private getModuleConfig(moduleName) {
    var moduleConfig = null;
    for (var i = 0; i < Build.modules.length; i++) {
      if (Build.modules[i].name === moduleName) {
        moduleConfig = Build.modules[i];
        break;
      }
    }
    return moduleConfig;
  }
}