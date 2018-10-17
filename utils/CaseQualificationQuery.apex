
List<AggregateResult> results=[Select Case__c , Count(ID) total From CaseQualification__c WHERE 
                               PrimaryQualification__c=true and CreatedBy.Name like '%nooreen%'  Group By Case__c  Having Count(Id)>1 LIMit 500];

Set<ID> caseIds=new Set<ID>();

for(AggregateResult ar: results){
    caseIds.add((ID)ar.get('Case__c'));
    
}

List<CaseQualification__c> cqs=[SELECT ID, case__c From CaseQualification__c WHERE PrimaryQualification__c=true LIMIT 500];

Set<ID> casesWithPrimary=new Set<ID>();
for(CaseQualification__c cq: cqs){
    casesWithPrimary.add(cq.case__c);
}

results=[Select Case__c , Count(ID) From CaseQualification__c
WHERE PrimaryQualification__c =false and CreatedBy.Name like '%nooreen%' and Case__c not in :casesWithPrimary   Group By Case__c LIMIT 500];

for(AggregateResult ar: results){
    caseIds.add((ID)ar.get('Case__c'));
}

cqs=[SELECT ID, case__c From CaseQualification__c WHERE case__c in :caseIds];
Integer count=0;
for(CaseQualification__c cq: cqs){
    System.debug(cq.Id);
    
    count++;
}
System.debug('Result Count: '+ count);







