
List<String> childObjects=new String[]{'Country_Brand__c'};
Map<String, String> queries=QueryBuilder.buildSObjectQueries('Country__c', childObjects);
for(String objectName: queries.keySet()){
    System.debug('#####################################################################################################');
    System.debug(objectname.toUpperCase());
    System.debug('#####################################################################################################');
    System.debug(queries.get(objectName));
}