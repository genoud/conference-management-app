
export default interface Profile {
  applicationVisibilities?: ProfileApplicationVisibility[];
  classAccesses?: ProfileApexClassAccess[];
  custom:boolean;
  customPermissions?: ProfileCustomPermissions[];
  description?: string;
  externalDataSourceAccesses? : ProfileExternalDataSourceAccess[];
  fieldLevelSecurities? : ProfileFieldLevelSecurity[];
  fieldPermissions? : ProfileFieldLevelSecurity[];
  fullName?: string;
  layoutAssignments?:ProfileLayoutAssignments[];
  loginHours?:ProfileLoginHours[];
  loginIpRanges?:ProfileLoginIpRange[];
  objectPermissions?:ProfileObjectPermissions[];
  pageAccesses?:ProfileApexPageAccess[];
  profileActionOverrides?:ProfileActionOverride[];
  recordTypeVisibilities?:ProfileRecordTypeVisibility[];
  tabVisibilities?: ProfileTabVisibility[];
  userLicense: string;
  userPermissions?:ProfileUserPermission[];
}

export interface ProfileApplicationVisibility {
   application: string;
   visible: boolean;
   default: boolean;
}

export interface ProfileApexClassAccess {
  apexClass: string;
  enabled: boolean;
}

export interface ProfileCustomPermissions {
  name: string;
  enabled: boolean;
}

export interface ProfileExternalDataSourceAccess {
  externalDataSource: string;
  enabled: boolean;
}

export interface ProfileFieldLevelSecurity {
  field: string;
  editable: boolean;
  readable: boolean;
  hidden: boolean;
}
export interface ProfileLayoutAssignments {
  layout: string;
  recordType: string;
}
export interface ProfileLoginHours {
  weekdayStart: string;
  weekdayEnd: string;
}
export interface ProfileLoginIpRange {
  description: string;
  endAddress: string;
  startAddress: string;
}

export interface ProfileObjectPermissions {
  object: string;
  allowCreate: boolean;
  allowDelete: boolean;
  allowEdit:boolean;
  allowRead:boolean;
  modifyAllRecords:boolean;
  viewAllRecords:boolean;
}
export interface ProfileActionOverride {
  actionName: string;
  content: string;
  formFactor: FormFactor;
  pageOrSobjectType:string;
  recordType:string;
  type:ActionOverrideType;
}

export enum FormFactor  {
  Large = "Large",
  Small = "Small",
  Medium = "Medium"
}
export enum ActionOverrideType   {
  default = "default",
  flexipage = "flexipage",
  lightningcomponent = "lightningcomponent",
  scontrol = "scontrol",
  standard = "standard",
  visualforce = "visualforce"
}

export interface ProfileApexPageAccess {
  apexPage: string;
  enabled: boolean;
}

export interface ProfileRecordTypeVisibility {
  recordType: string;
  visible: boolean;
  personAccountDefault: boolean;
  default: boolean;
}

export interface ProfileTabVisibility {
  tab: string;
  visibility: TabVisibility ;
}

export enum TabVisibility   {
  DefaultOff = "DefaultOff",
  DefaultOn = "DefaultOn",
  Hidden = "Hidden"
}

export interface ProfileUserPermission {
  name: string;
  enabled: boolean;
}