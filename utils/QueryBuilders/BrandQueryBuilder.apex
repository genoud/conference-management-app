
List<String> childObjects=new String[]{'Product_lines__c'};
Map<String, String> queries=QueryBuilder.buildSObjectQueries('Brand__c', childObjects);
for(String objectName: queries.keySet()){
    System.debug('#####################################################################################################');
    System.debug(objectname.toUpperCase());
    System.debug('#####################################################################################################');
    System.debug(queries.get(objectName));
}