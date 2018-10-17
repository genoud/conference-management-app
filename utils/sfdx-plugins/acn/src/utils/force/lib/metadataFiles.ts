import ISfdxConfigs from "./global";
import FileUtils from "../../lib/fsutils";

const configs = require('./global') as ISfdxConfigs;

export default class MetadataFiles{
    apps: string[];
    objects: string[];
    fields: string[];
    layouts: string[];
    classes: string[];
    recordTypes: string[];
    pages: string[];
    tabs: string[];
    profiles: string[];
    permissionSets: string[];
    translations: string[];

    constructor (){
        this.init();
    }

    public init():void{
        this.apps=[];
        this.objects=[];
        this.fields=[];
        this.layouts=[];
        this.classes=[];
        this.recordTypes=[];
        this.pages=[];
        this.tabs=[];
        this.profiles=[];
        this.permissionSets=[];
        this.translations=[];
    }
    public loadComponents(srcFolder:string): void{
        var me: MetadataFiles=this;
        var metadataFiles: string[] = FileUtils.getAllFilesSync(srcFolder);
        if(Array.isArray(metadataFiles) && metadataFiles.length>0){
            metadataFiles.forEach(metadataFile => {
                if(metadataFile.endsWith(configs.appExtension)){
                    me.apps.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.classExtension)){
                    me.classes.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.fieldExtension)){
                    me.fields.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.layoutExtension)){
                    me.layouts.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.objectExtension)){
                    me.objects.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.pageExtension)){
                    me.pages.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.permsetExtension)){
                    me.permissionSets.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.profileExtension)){
                    me.profiles.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.recordTypeExtension)){
                    me.recordTypes.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.tabExtension)){
                    me.tabs.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.translationExtension)){
                    me.translations.push(metadataFile);
                }
            });
        }
    }
    public loadComponentsByType(srcFolder:string, componentTypes:string[]): void{
        var me: MetadataFiles=this;
        var metadataFiles: string[] = FileUtils.getAllFilesSync(srcFolder);
        if(Array.isArray(metadataFiles) && metadataFiles.length>0){
            metadataFiles.forEach(metadataFile => {
                if(metadataFile.endsWith(configs.appExtension)){
                    me.apps.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.classExtension)){
                    me.classes.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.fieldExtension)){
                    me.fields.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.layoutExtension)){
                    me.layouts.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.objectExtension)){
                    me.objects.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.pageExtension)){
                    me.pages.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.permsetExtension)){
                    me.permissionSets.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.profileExtension)){
                    me.profiles.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.recordTypeExtension)){
                    me.recordTypes.push(metadataFile);
                }
                if(metadataFile.endsWith(configs.tabExtension)){
                    me.tabs.push(metadataFile);
                }
            });
        }
    }
}