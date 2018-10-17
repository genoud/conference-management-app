
List<String> childObjects=new String[]{'Product_EAN__c', 'Axe_sous_axe__c'};
Map<String, String> queries=QueryBuilder.buildSObjectQueries('Axe_CRM__c', childObjects);
for(String objectName: queries.keySet()){
    System.debug('#####################################################################################################');
    System.debug(objectname.toUpperCase());
    System.debug('#####################################################################################################');
    System.debug(queries.get(objectName));
}