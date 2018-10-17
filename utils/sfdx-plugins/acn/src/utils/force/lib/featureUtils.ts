import ISfdxConfigs from "./global";
import FileUtils from "../../lib/fsutils";
import Profile, { ProfileRecordTypeVisibility } from "../types/profile";
import MetadataFiles from "./metadataFiles";
import { SfdxCommand } from "@salesforce/command";
import { Org, AuthInfo } from "@salesforce/core";
import { ErrorResult, SuccessResult } from "jsforce/record-result";


var glob = require("glob")
const fs = require('fs');
const path = require('path');
const configs = require('./global') as ISfdxConfigs;
var xml2js = require('xml2js');
const puppeteer = require('puppeteer');

const COMMUNITY_FEATURE = "Community"

const CHECKBOX_SELECTOR = "input[id*='enableNetworkPrefId'][id$='enableNetworkPrefId']";
const SAVE_BUTTON_SELECTOR = "input[id*='thePage:theForm:setDomainPB:btnPageBlock:bottom:saveId'][id$='saveId']";
const USER_BUTON_SELECTOR = "button.bare.branding-userProfile-button.slds-button.activated.uiButton.forceHeaderButton.oneUserProfileCardTrigger";
const SWITH_TO_LIGHTNING_LINK_SELECTOR = "a.profile-link-label.switch-to-aloha.uiOutputURL";

export default class AcnFeatureUtils {

  public constructor(private org: Org, private cmd: SfdxCommand) {
  }

  public async enableSalesforceClassic(){
    var me=this;
    var conn=this.org.getConnection();
    
   
    var userName=this.org.getMetaInfo().info.getFields().username;
    
    const query = "Select Id, Name from User WHERE username='" + userName + "'";

    // Query the org
    const result = await conn.query<any>(query);

    var userId = result.records[0].Id;
    var name = result.records[0].Name;

    var recordResult = await conn.sobject("User").update({ 
      Id: userId,
      UserPreferencesLightningExperiencePreferred  : false,
    });

    if(recordResult.success){
      var success=recordResult as SuccessResult;
      me.cmd.log('Salesforce classic enabled for user  : ' + userName + " With Id: "+ success.id);
    }
    else{
      var err=recordResult as ErrorResult;
      this.cmd.error(err.errors.join(" | "));
    }
    
  }
  public async enableLightningExperience(){
    var me=this;
    var conn=this.org.getConnection();
    
   
    var userName=this.org.getMetaInfo().info.getFields().username;
    
    const query = "Select Id, Name from User WHERE username='" + userName + "'";

    // Query the org
    const result = await conn.query<any>(query);

    var userId = result.records[0].Id;
    var name = result.records[0].Name;

    var recordResult = await conn.sobject("User").update({ 
      Id: userId,
      UserPreferencesLightningExperiencePreferred  : true,
    });

    if(recordResult.success){
      var success=recordResult as SuccessResult;
      me.cmd.log('Lightning experience enabled for user  : ' + userName + " With Id: "+ success.id);
    }
    else{
      var err=recordResult as ErrorResult;
      this.cmd.error(err.errors.join(" | "));
    }
  }

  public async  enableCommunity() {
    await this.enableSalesforceClassic();
    process.on("uncaughtException", (e) => {
      console.error("Unhandled exeption:", e);
    });
    process.on("unhandledRejection", (reason, p) => {
      console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
      // application specific logging, throwing an error, or other logic here
    });
    //const browser = await puppeteer.launch();
    this.cmd.log("Launching the browser");
    /*
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: !(process.env.BROWSER_DEBUG === "true")
    });
    */
    const browser = await puppeteer.launch({
      headless: true
    });

    this.cmd.log("opening a new Page");
    let page = await browser.newPage();

    

    this.cmd.log("Set default timeout and viewport size");

    page.setDefaultNavigationTimeout(100000);
    await page.setViewport({ width: 1024, height: 768 });

    this.cmd.log("Go to page ");
    this.cmd.log(`${this.org.getMetaInfo().info.getConnectionOptions().instanceUrl}/secur/frontdoor.jsp?sid=${
      this.org.getMetaInfo().info.getConnectionOptions().accessToken}&retURL=_ui/networks/setup/NetworkSettingsPage`);

    await page.goto(
      `${this.org.getMetaInfo().info.getConnectionOptions().instanceUrl}/secur/frontdoor.jsp?sid=${
      this.org.getMetaInfo().info.getConnectionOptions().accessToken}&retURL=_ui/networks/setup/NetworkSettingsPage`
    );

    this.cmd.log("Wait for navigation ");
    await page.waitForNavigation();

    this.cmd.log("Wait for Checkbox");
    //const featureArticle = (await page.$x('//*[@id="mp-tfa"]'))[0];
    //await page.waitForXPath('//*[@id="thePage:theForm:setDomainPB:enableNetworkPrefId"]', {timeout: 50000});
    await page.waitFor(CHECKBOX_SELECTOR, {timeout: 50000});

    this.cmd.log("click on checkbox ");
    page.click(CHECKBOX_SELECTOR, { "button": "left" });

    this.cmd.log("Wait for save button");
    await page.waitFor(SAVE_BUTTON_SELECTOR);

    this.cmd.log("Listening to dialog event ");
    page.on("dialog", async dialog => {
      this.cmd.log("Dialog displayed");
      this.cmd.log(dialog.message());
      await dialog.accept();
      this.cmd.log("close the page");
      await page.close();
      this.cmd.log("close the browser");
      await browser.close();
    });

    this.cmd.log("First Click on save button");
    page.click(SAVE_BUTTON_SELECTOR, { "button": "left" });

    this.cmd.log("Wait for  save button");
    await page.waitFor(SAVE_BUTTON_SELECTOR);

    this.cmd.log("Second Click on save button");
    page.click(SAVE_BUTTON_SELECTOR, { "button": "left" });

    //await page.waitForNavigation();
  }

  public async bypassVR(value:boolean){
    var me=this;
    var conn=this.org.getConnection();
    
   
    var userName=this.org.getMetaInfo().info.getFields().username;
    
    const query = "Select Id, Name from User WHERE username='" + userName + "'";

    // Query the org
    const result = await conn.query<any>(query);

    var userId = result.records[0].Id;
    var name = result.records[0].Name;

    var recordResult = await conn.sobject("User").update({ 
      Id: userId,
      ByPass_VR__c  : value,
    });

    if(recordResult.success){
      var success=recordResult as SuccessResult;
      me.cmd.log('bypass  Validation rule field updated for user   : ' + userName + " With Id: "+ success.id);
    }
    else{
      var err=recordResult as ErrorResult;
      this.cmd.error(err.errors.join(" | "));
    }
    
  }

}

