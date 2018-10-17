
Map<String, String> queries=QueryBuilder.buildSObjectQueriesWithParent('Gender_transcodification__c');
for(String objectName: queries.keySet()){
    System.debug('#####################################################################################################');
    System.debug(objectname.toUpperCase());
    System.debug('#####################################################################################################');
    System.debug(queries.get(objectName));
}