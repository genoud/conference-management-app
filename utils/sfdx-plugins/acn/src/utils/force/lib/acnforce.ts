import { ApplicationVisibility } from "..";
import PermissionSet, { PermissionSetFieldPermissions, PermissionSetRecordTypeVisibility, PermissionSetObjectPermissions, PermissionSetTabSetting, PermissionSetTabVisibility, PermissionSetApexClassAccess, PermissionSetApexPageAccess } from "../types/permissionSet";
import ISfdxConfigs from "./global";
import FileUtils from "../../lib/fsutils";


var glob = require("glob")
const fs = require('fs');
const path = require('path');
const configs = require('./global') as ISfdxConfigs;
//const fsUtils = require('./../../lib/fsutils');
var fsUtils=FileUtils;

export default class AcnForceUtils{
    public static permsetExtension=".permissionset-meta.xml";
    public static profileExtension=".profile-meta.xml";
}

