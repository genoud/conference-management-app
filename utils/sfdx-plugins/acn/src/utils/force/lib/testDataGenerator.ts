import ISfdxConfigs from "./global";
import FileUtils from "../../lib/fsutils";
import Profile, { ProfileRecordTypeVisibility } from "../types/profile";
import MetadataFiles from "./metadataFiles";
import { SfdxUtil, Org } from "@salesforce/core";
import AcnUtils from "../../lib/global";

var glob = require("glob")
const fs = require('fs');
const path = require('path');
const configs = require('./global') as ISfdxConfigs;
var xml2js = require('xml2js');

export default class TestDataGenerator {
  private static generatedData = {};//object that contains generated data
  public constructor(public org: Org, public dataStructure: any[], public queryFolder: string, public outputFolder: string) {

  }

  public async generateData(): Promise<any> {
    var data = {};
    // var importPlanArray = [];
    for (var i = 0; i < this.dataStructure.length; i++) {
      var element = this.dataStructure[i];
      var elementRecords = await this.getDataByElement(element, data);
      //console.log("Records found: "+ Object.keys(elementRecords).length);
      data[element.sobject] = elementRecords;
      /* if (Object.keys(elementRecords).length > 0) {
        var importPlan = this.generateImportPlan(element, importPlanArray);
        importPlanArray.push(importPlan);
      } */
    }
    if (fs.existsSync(this.outputFolder) == false) {
      fs.mkdirSync(this.outputFolder);
    }


    this.buildExportPlan(this.dataStructure, data);

    //generate one file for each type
    this.generateFiles(data, this.outputFolder);
    return data;
  }

  private buildExportPlan(dataSctructure, data) {

    var importPlanArray = [];
    for (var i = 0; i < this.dataStructure.length; i++) {
      var element = this.dataStructure[i];
      var importPlan = this.generateImportPlan(element, importPlanArray, data);
      if (AcnUtils.isNotNull(importPlan)) {
        importPlanArray.push(importPlan);
      }
    }
    var outputPath = path.join(this.outputFolder, "data-export-plan.json");
    SfdxUtil.writeJSON(outputPath, importPlanArray);

  }
  private countRecords(objectRecords) {
    var objectArray = [];
    for (var id in objectRecords) {
      var record = objectRecords[id];
      objectArray.push(record);
    }
    return objectArray.length;
  }

  private hasParentOfSameType(sObjectType): boolean {

    var element = this.getObjectStructureDefinition(sObjectType);
    var parents = element.parents;
    for (var j = 0; j < parents.length; j++) {
      var parentType = parents[j].SobjectType as string;
      if (parentType === sObjectType) {
        return true;
      }
    }

    return false;
  }

  public generateFiles(data, outputFolder) {
    for (var sObjectType in data) {
      var objectRecords = data[sObjectType];
      var objectArray = [];
      //console.log("checking if object has parent of same type" + sObjectType);
      var hasParentOfSameType = this.hasParentOfSameType(sObjectType);
      //console.log("Has parent of same type checked " + hasParentOfSameType);
      for (var id in objectRecords) {
        var record = data[sObjectType][id];
        objectArray.push(record);
      }

      if (hasParentOfSameType) {
        //console.log("Has parent of same type " + sObjectType);
        var element = this.getObjectStructureDefinition(sObjectType);
        var parentField = element.parents.filter(parent => {
          return parent.SobjectType === sObjectType;
        })[0].FieldName;
        var parentArray = [];
        for (var id in objectRecords) {
          var parentRecord = data[sObjectType][id];
          var parentRef = "@" + parentRecord.attributes.referenceId;
          //console.log("Parent Records " + id + " Ref " + parentRef);
          for (var i = 0; i < objectArray.length; i++) {
            var record = objectArray[i];
            //console.log("child Records " + i + " Ref " + record.attributes.referenceId + " Parent Ref " + record[parentField]);
            if (record[parentField] === parentRef) {
              parentArray.push(parentRecord);
              break;
            }
          }
        }
        var toSave = { "records": parentArray };
        var outputPath = path.join(this.outputFolder, sObjectType + "__parent.json");
        SfdxUtil.writeJSON(outputPath, toSave);

        objectArray = objectArray.filter(record => {
          var isParent = false;
          for (var i = 0; i < parentArray.length; i++) {
            if (parentArray[i].attributes.referenceId === record.attributes.referenceId) {
              isParent = true;
              break;
            }
          }
          return !isParent;
        });
      }

      var toSave = { "records": objectArray };
      var outputPath = path.join(this.outputFolder, sObjectType + ".json");
      SfdxUtil.writeJSON(outputPath, toSave);
    }
  }


  public generateImportPlan(element, importPlanArray, data) {
    if (this.planExists(element, importPlanArray)) {
      return null;
    }
    var objectRecords = data[element.sobject];
    var counts = this.countRecords(objectRecords);
    if (counts <= 0) {
      return null;
    }

    var parents = element.parents;
    var parentRecords = {};
    if (parents.length > 0) {
      for (var i = 0; i < parents.length; i++) {
        var parent = parents[i];
        var parentType = parent.SobjectType as string;
        var parentelement = this.getObjectStructureDefinition(parentType);
        if (parentType !== element.sobject) {
          var parentPlan = this.generateImportPlan(parentelement, importPlanArray, data);
          if (!AcnUtils.isNull(parentPlan)) {
            importPlanArray.push(parentPlan);
          }
        }
        else {
          //Generate a disting plan for parent record that will import parent before child record of same type
          var parentPlan = {
            "sobject": parentelement.sobject,
            "saveRefs": true,
            "resolveRefs": true,
            "files": [
              parentelement.sobject + "__parent.json"
            ]
          }
          importPlanArray.push(parentPlan);
        }
      }
    }
    //console.log("Element  ");
    var importPlan = {
      "sobject": element.sobject,
      "saveRefs": true,
      "resolveRefs": true,
      "files": [
        element.sobject + ".json"
      ]
    }
    return importPlan;
  }

  private planExists(element, importPlanArray) {
    var found = false;
    for (var i = 0; i < importPlanArray.length; i++) {
      var plan = importPlanArray[i];
      var sObjectType = plan.sobject as string;
      var elementType = element.sobject as string;
      sObjectType = sObjectType.trim().toLowerCase();
      elementType = elementType.trim().toLowerCase();
      if (sObjectType === elementType) {
        found = true;
        break;
      }
    }
    return found;
  }

  public async getParentRecords(records, parents, data): Promise<any> {
    //console.log("Geting parent records " + records.length);
    var parentRecords = {};
    if (parents.length > 0) {
      for (var k = 0; k < parents.length; k++) {
        var parent = parents[k];
        var parentIdsToload = {};
        for (var j = 0; j < records.length; j++) {
          var record = records[j];
          var parentId = record[parent.FieldName];
          //console.log("Parent ID To load "+ parentId + "Parent Field Name "+ parent.FieldName);
          //console.log(record);
          if (parentId) {
            if (AcnUtils.isNull(data[parent.SobjectType]) || (AcnUtils.isNotNull(data[parent.SobjectType])
              && AcnUtils.isNull(data[parent.SobjectType][parentId]))) {
              if (!parentIdsToload[parent.SobjectType]) {
                parentIdsToload[parent.SobjectType] = [];
              }
              parentIdsToload[parent.SobjectType].push(parentId);
            }
          }
        }
        var objects = Object.keys(parentIdsToload);
        for (var i = 0; i < objects.length; i++) {
          var object = objects[i];
          //load the parent object definition
          var element = this.getObjectStructureDefinition(object);
          if (element && element != null && element != undefined) {
            parentRecords = await this.getDataByElement(element, data, parentIdsToload[object]);
            data[element.sobject] = parentRecords;
          }
        }
      }
    }
    return parentRecords;
  }

  private getObjectStructureDefinition(sobjecttype: string) {
    var foundElement = null;
    for (var i = 0; i < this.dataStructure.length; i++) {
      var element = this.dataStructure[i];
      var elementObject: string = element.sobject as string;

      elementObject = elementObject.trim();
      elementObject = elementObject.toLowerCase();

      sobjecttype = sobjecttype.trim().toLowerCase();
      if (elementObject === sobjecttype) {
        foundElement = element;
        break;
      }
    }
    return foundElement;
  }

  public async getDataByElement(element, data, ids?: string[]): Promise<any> {
    var records = [];
    if (ids && ids.length > 0) {
      records = await this.generateDatabyChildParentId(element.sobject, ids);
    }
    else {
      records = await this.generateDataBySobject(element.sobject);
    }

    //generate parent object here
    var parents = element.parents;
    var parentRecords = {};
    if (parents.length > 0) {
      //console.log("Parent element exists");
      parentRecords = await this.getParentRecords(records, parents, data);
      //console.log("Parent element loaded: " + Object.keys(parentRecords).length);
    }
    var elementRecords = {};
    if (data[element.sobject]) {
      elementRecords = data[element.sobject];
    }
    var recordCount = Object.keys(elementRecords).length
    for (var j = 0; j < records.length; j++) {
      recordCount++;
      var record = records[j];
      var id = record.Id;
      delete record.Id;
      record.attributes = {
        "type": element.sobject,
        "referenceId": element.sobject + "Ref" + recordCount
      }
      //replace the parent Id value with it generated reference
      if (parents.length > 0) {
        for (var i = 0; i < parents.length; i++) {
          var parentFieldName = parents[i].FieldName;
          var parentType = parents[i].SobjectType;
          var parentRef = this.getParentReference(data, record[parentFieldName], parentType);
          if (AcnUtils.isNotNull(parentRef)) {
            record[parentFieldName] = "@" + parentRef;
          }
          else {
            delete record[parentFieldName];
          }

        }
      }
      //console.log(record);
      elementRecords[id] = record;
    }
    return elementRecords;
  }

  private getParentReference(data, parentId, parentType) {
    var parentTypes = Object.keys(data);
    var parentRef = null;
    for (var i = 0; i < parentTypes.length; i++) {
      var oneParentType = parentTypes[i];
      if (oneParentType === parentType) {
        var parentData = data[parentType];
        var parentIds = Object.keys(parentData);
        for (var j = 0; j < parentIds.length; j++) {
          var oneParentId = parentIds[j];
          if (oneParentId === parentId) {
            var record = data[oneParentType][oneParentId];
            parentRef = record.attributes.referenceId;
          }
        }
      }
    }
    return parentRef;
  }

  public async generateDataBySobject(sobjectType: string): Promise<any[]> {

    console.log("Generating data for " + sobjectType);

    var queryFile = path.join(process.cwd(), this.queryFolder, sobjectType + ".soql");
    var query = await SfdxUtil.readFile(queryFile, "utf8");

    //console.log("QUERY: "+query);

    const conn = this.org.getConnection();

    // Query the org
    const result = await conn.query<any>(query);

    //console.log("NB Records: "+result.records.length);

    //Build the array
    if (!result.records || result.records.length <= 0) {
      return [];
    }

    return result.records;

  }

  public async generateDatabyChildParentId(sobjectType: string, ids: string[]) {

    console.log("Querying parent records " + sobjectType);
    var queryFile = path.join(process.cwd(), this.queryFolder, sobjectType + ".soql");


    var query = await SfdxUtil.readFile(queryFile, "utf8");
    const idsWithQuote = ids.map(id => "'" + id + "'");

    var idClause = idsWithQuote.join(", ");
    idClause = "Id in (" + idClause + ")";
    if (query.includes("WHERE")) {
      var queryParts = query.split("WHERE");
      queryParts = [queryParts[0], "WHERE", idClause]; //, "AND", queryParts[1]
      query = queryParts.join(" ");
    }
    else {
      var queryParts = query.split("FROM");
      var fromParts = queryParts[1].split(" ");
      var fromPartsFiltered = fromParts.filter(element => {
        var elementObject: string = element as string;

        elementObject = elementObject.trim();
        elementObject = elementObject.toLowerCase();

        var strLowersobjectType = sobjectType.trim().toLowerCase();
        return elementObject !== strLowersobjectType;
      });
      //console.log(fromPartsFiltered);
      //var fromPartStr = fromPartsFiltered.join(" ");
      queryParts = [queryParts[0], "FROM", sobjectType, "WHERE", idClause]; //, fromPartStr
      query = queryParts.join(" ");
      //console.log(query);
    }

    const conn = this.org.getConnection();

    //console.log("Query of the parent records" );
    //console.log(query);
    // Query the org
    const result = await conn.query<any>(query);

    //Build the array
    if (!result.records || result.records.length <= 0) {
      return [];
    }

    return result.records;
  }

}

