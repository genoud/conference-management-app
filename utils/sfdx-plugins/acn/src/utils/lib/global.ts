export default class AcnUtils{
    public static isNotNull(value:any):boolean{
        if (typeof value !== 'undefined' && value !== null){
            return true;
        }
        return false;
    }
    public static isNull(value:any):boolean{
        if (typeof value === 'undefined' ||  value === null){
            return true;
        }
        return false;
    }
}
