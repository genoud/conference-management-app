public with sharing class QueryBuilder{

    private static final  List<String> excludedFields=new String[]{'id','isdeleted','ownerid','createddate', 
        'createdbyid', 'lastmodifieddate', 'lastmodifiedbyid', 'systemmodstamp', 'lastviweddate',
        'lastreferenceddate', 'lastactivitydate', 'lastcurequestdate', 'lastcuupdatedate', 'lastvieweddate' };

    private static Set<String> getSObjectFieldList(String sObjectName){
        Map<String, Schema.SObjectField> objectFields = Schema.getGlobalDescribe()
            .get(sObjectName).getDescribe().fields.getMap();
        Set<String> sObjectFieldList = new set<String>();

        for(String fieldKey: objectFields.keySet()){
            Schema.DescribeFieldResult fieldDescribe = objectFields.get(fieldKey).getDescribe();
            String fieldName = fieldDescribe.getName();
            if(fieldDescribe.isAccessible() && fieldDescribe.isUpdateable() 
            && !Schema.DisplayType.REFERENCE.equals(fieldDescribe.getType()) 
            && !fieldDescribe.isCalculated()){
                if(!excludedFields.contains(fieldName.toLowerCase()) && !fieldName.endsWith('StateCode')
                && !fieldName.endsWith('CountryCode') && !(sObjectName.equalsIgnoreCase('Account') && fieldName.equalsIgnoreCase('Name'))){
                    sObjectFieldList.add(fieldName);
                }
            }
        }
        return sObjectFieldList;
    }
    private static Set<String> getSObjectFieldList(String sObjectName, List<String> childObjects){
        List<Schema.ChildRelationship> childRelationships = Schema.getGlobalDescribe()
            .get(sObjectName).getDescribe().getChildRelationships();
        Set<String> sObjectFieldList = getSObjectFieldList(sObjectName);
        for(Schema.ChildRelationship childRelationship: childRelationships){
            String childObjectName=childRelationship.getChildSObject().getDescribe().getName();
            //System.debug('child Object Name: '+childObjectName );
            if(childObjects.contains(childObjectName)){
                Set<String> childObjectFieldsSet= getSObjectFieldList(childObjectName);
                String strChildFields = String.join(new List<String>(childObjectFieldsSet), ', ');
                sObjectFieldList.add('( SELECT '+strChildFields+' FROM ' +childRelationship.getRelationshipName()+' )');
            }
        }
        return sObjectFieldList;
    }

    public static String buildSObjectQuery(String sObjectName){
        Set<String> fields = getSObjectFieldList(sObjectName);
        String strFields = String.join(new List<String>(fields), ', ');
        String query = 'SELECT '+ strFields + ' FROM  '+ sObjectName;
        return query;
    }
    public static String buildSObjectQuery(String sObjectName, List<String> childObjects){
        Set<String> fields = getSObjectFieldList(sObjectName, childObjects);
        String strFields = String.join(new List<String>(fields), ', ');
        String query = 'SELECT '+ strFields + ' FROM  '+ sObjectName;
        return query;
    }
    /**
        * Build a query with a limit
    **/
    public static String buildSObjectQueryLimit(String sObjectName, Integer nbRecord){
        String query = buildSObjectQuery(sObjectName)+ ' limit  '+ String.valueOf(nbRecord);
        return query;
    }

    public static String buildSObjectQueryLimit(String sObjectName, Integer nbRecord, List<String> childObjects){
        String query = buildSObjectQuery(sObjectName, childObjects)+ ' limit  '+ String.valueOf(nbRecord);
        return query;
    }

    private static Map<String, String> buildParentQueries(String sObjectName){
        Map<String, Schema.SObjectField> objectFields = Schema.getGlobalDescribe()
            .get(sObjectName).getDescribe().fields.getMap();
        Map<String, String> queries = new Map<String, String>();
        for(String fieldKey: objectFields.keySet()){
            Schema.DescribeFieldResult fieldDescribe = objectFields.get(fieldKey).getDescribe();
            if(fieldDescribe.isAccessible()  && Schema.DisplayType.REFERENCE.equals(fieldDescribe.getType()) ){
                Schema.sObjectType[] parents=fieldDescribe.getReferenceTo();
                for(Schema.sObjectType parent:parents){
                    queries.put(parent.getDescribe().getName(), buildSObjectQueryLimit(parent.getDescribe().getName(), 5));
                }
            }
        }
        return queries;

    }
    public static Map<String, String> buildSObjectQueriesWithParent(String sObjectName){
        Map<String, String> queries = buildParentQueries(sObjectName);
        queries.put(sObjectName, buildSObjectQueryLimit(sObjectName, 20));
        return queries;
    }
    public static Map<String, String> buildSObject(String sObjectName){
        Map<String, String> queries = new Map<String, String>();
        queries.put(sObjectName, buildSObjectQueryLimit(sObjectName, 20));
        return queries;
    }

    public static Map<String, String> buildSObjectQueriesWithParent(String sObjectName, List<String> childObjects){
        Map<String, String> queries = buildParentQueries(sObjectName);
        queries.put(sObjectName, buildSObjectQueryLimit(sObjectName, 20, childObjects));
        return queries;
    }
    public static Map<String, String> buildSObjectQueries(String sObjectName, List<String> childObjects){
        Map<String, String> queries = new Map<String, String>();
        queries.put(sObjectName, buildSObjectQueryLimit(sObjectName, 20, childObjects));
        return queries;
    }
}