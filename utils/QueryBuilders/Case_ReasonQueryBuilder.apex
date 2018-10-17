
List<String> childObjects=new String[]{'Case_reason_solutions__c'};
Map<String, String> queries=QueryBuilder.buildSObjectQueries('Case_Reason__c', childObjects);
for(String objectName: queries.keySet()){
    System.debug('#####################################################################################################');
    System.debug(objectname.toUpperCase());
    System.debug('#####################################################################################################');
    System.debug(queries.get(objectName));
}