
Map<String, String> queries=QueryBuilder.buildSObjectQueriesWithParent('Civility__c');
for(String objectName: queries.keySet()){
    System.debug('#####################################################################################################');
    System.debug(objectname.toUpperCase());
    System.debug('#####################################################################################################');
    System.debug(queries.get(objectName));
}