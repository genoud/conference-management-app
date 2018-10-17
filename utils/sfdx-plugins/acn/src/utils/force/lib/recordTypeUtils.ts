import ISfdxConfigs from "./global";
import FileUtils from "../../lib/fsutils";
import Profile, { ProfileRecordTypeVisibility } from "../types/profile";
import MetadataFiles from "./metadataFiles";
import { Org } from "@salesforce/core";


var glob = require("glob")
const fs = require('fs');
const path = require('path');
const configs = require('./global') as ISfdxConfigs;
var xml2js = require('xml2js');


export default class AcnRecordTypeUtils {
  private static cachedRecordTypes=[];
  private static recordTypesLoaded=false;
  public constructor(public org:Org){

  }

  public async getRecordType(): Promise<RecordType[]>{
    if(AcnRecordTypeUtils.recordTypesLoaded){
      return AcnRecordTypeUtils.cachedRecordTypes;
    }
    const conn = this.org.getConnection();
    const query = 'Select Id, Name, DeveloperName, SobjectType from RecordType';

    // Query the org
    const result = await conn.query<RecordType>(query);

    //Build the array
    if (!result.records || result.records.length <= 0) {
      return [];
    }

    AcnRecordTypeUtils.recordTypesLoaded=true;
    AcnRecordTypeUtils.cachedRecordTypes=result.records;

    return result.records;
  }

  public async getRecordTypeBySobjectType(sobjectType: string): Promise<RecordType[]>{
    var recordTypes=AcnRecordTypeUtils.cachedRecordTypes;
    if(!AcnRecordTypeUtils.recordTypesLoaded){
      recordTypes = await this.getRecordType();
    }

    var filtered=recordTypes.filter((recordType: RecordType) =>{
      return recordType.SobjectType===sobjectType;
    });
    
    return filtered;
    
  }

  
}

export interface RecordType{
  Id: string;
  Name: string;
  DeveloperName: string;
  Description?: string;
  SobjectType: string;
  IsActive?: string;
  IsPersonType?: boolean;
  NamespacePrefix?: string;
  BusinessProcessId?: string;
}

