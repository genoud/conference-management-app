
Map<String, String> queries=QueryBuilder.buildSObjectQueriesWithParent('Brand_template_mapping__c');
for(String objectName: queries.keySet()){
    System.debug('#####################################################################################################');
    System.debug(objectname.toUpperCase());
    System.debug('#####################################################################################################');
    System.debug(queries.get(objectName));
}