
export default interface PermissionSet {
  applicationVisibilities?: ApplicationVisibility[];
  classAccesses?: PermissionSetApexClassAccess[];
  customPermissions?: PermissionSetCustomPermissions[];
  description?: string;
  externalDataSourceAccesses? : PermissionSetExternalDataSourceAccess[];
  fieldPermissions? : PermissionSetFieldPermissions[];
  hasActivationRequired?: boolean;
  label:string;
  license?:string;
  objectPermissions?:PermissionSetObjectPermissions[];
  pageAccesses?:PermissionSetApexPageAccess[];
  recordTypeVisibilities?:PermissionSetRecordTypeVisibility[];
  tabSettings?: PermissionSetTabSetting[];
  userPermissions?:PermissionSetUserPermission[];
}

export interface ApplicationVisibility {
   application: string;
   visible: boolean;
}

export interface PermissionSetApexClassAccess {
  apexClass: string;
  enabled: boolean;
}

export interface PermissionSetCustomPermissions {
  name: string;
  enabled: boolean;
}

export interface PermissionSetExternalDataSourceAccess {
  externalDataSource: string;
  enabled: boolean;
}

export interface PermissionSetFieldPermissions {
  field: string;
  editable: boolean;
  readable: boolean;
}
export interface PermissionSetObjectPermissions {
  object: string;
  allowCreate: boolean;
  allowDelete: boolean;
  allowEdit:boolean;
  allowRead:boolean;
  modifyAllRecords:boolean;
  viewAllRecords:boolean;
}

export interface PermissionSetApexPageAccess {
  apexPage: string;
  enabled: boolean;
}

export interface PermissionSetRecordTypeVisibility {
  recordType: string;
  visible: boolean;
}

export interface PermissionSetTabSetting {
  tab: string;
  visibility: PermissionSetTabVisibility;
}

export enum PermissionSetTabVisibility  {
  Available = "Available",
  None = "None",
  Visible = "Visible"
}

export interface PermissionSetUserPermission {
  name: string;
  enabled: boolean;
}