List<Case> cases=[SELECT ID From Case LIMIT 200];
delete cases;

List<QuickText> quicktexts=[SELECT ID From QuickText LIMIT 200];
delete quicktexts;

List<Gender_transcodification__c> genderTranscodifications=[SELECT ID From Gender_transcodification__c LIMIT 200];
delete genderTranscodifications;

List<Civility__c> civilities=[SELECT ID From Civility__c LIMIT 200];
delete civilities;

List<Webform_transcodification__c> WebformTranscodifications=[SELECT ID From Webform_transcodification__c LIMIT 200];
delete WebformTranscodifications;

List<Brand_template_mapping__c> BrandTemplateMappings=[SELECT ID From Brand_template_mapping__c LIMIT 200];
delete BrandTemplateMappings;

List<Country_Phone_Codes__c> CountryPhoneCodes=[SELECT ID From Country_Phone_Codes__c LIMIT 200];
delete CountryPhoneCodes;

List<Complaint_Reason__c> ComplaintReasons=[SELECT ID From Complaint_Reason__c LIMIT 200];
delete ComplaintReasons;

List<CS_WebformProductCategoryMapping__c> CSWebformProductCategoryMappings=[SELECT ID From CS_WebformProductCategoryMapping__c LIMIT 200];
delete CSWebformProductCategoryMappings;

List<Email_To_Case_Field__c> EmailToCaseFields=[SELECT ID From Email_To_Case_Field__c LIMIT 200];
delete EmailToCaseFields;

List<Email_to_Case_Name_Mapping__c> EmailtoCaseNameMappings=[SELECT ID From Email_to_Case_Name_Mapping__c LIMIT 200];
delete EmailtoCaseNameMappings;

List<Email_To_Case_Webform__c> EmailToCaseWebforms=[SELECT ID From Email_To_Case_Webform__c LIMIT 200];
delete EmailToCaseWebforms;

List<EscalationMapping__c> EscalationMappings=[SELECT ID From EscalationMapping__c LIMIT 200];
delete EscalationMappings;

List<Goodwill_Order_Approval__c> Goodwill_Order_Approvals=[SELECT ID From Goodwill_Order_Approval__c LIMIT 200];
delete Goodwill_Order_Approvals;

List<IC_Vigilor__c> IC_Vigilors=[SELECT ID From IC_Vigilor__c LIMIT 200];
delete IC_Vigilors;

List<ProductTranscode__c> ProductTranscodes=[SELECT ID From ProductTranscode__c LIMIT 200];
delete ProductTranscodes;

List<CSProfile_Language__c> CSProfile_Languages=[SELECT ID From CSProfile_Language__c LIMIT 200];
delete CSProfile_Languages;

List<Product_catalogue_mapping__c> Product_catalogue_mappings=[SELECT ID From Product_catalogue_mapping__c LIMIT 200];
delete Product_catalogue_mappings;

List<Template_Settings__c> Template_Settings=[SELECT ID From Template_Settings__c LIMIT 200];
delete Template_Settings;

List<Webform__c> Webforms=[SELECT ID From Webform__c LIMIT 200];
delete Webforms;

List<Case_reason_solutions__c> case_reason_solutions=[SELECT ID From Case_reason_solutions__c LIMIT 200];
delete case_reason_solutions;

List<ContactReasonSolution__c> contact_reason_solutions=[SELECT ID From ContactReasonSolution__c LIMIT 200];
delete contact_reason_solutions;



List<Case_reason__c> childCaseReasons =[SELECT ID From Case_reason__c WHERE Parent_reason__c != null LIMIT 200];
delete childCaseReasons;

List<Case_reason__c> parentCaseReasons =[SELECT ID From Case_reason__c LIMIT 200];
delete parentCaseReasons;

List<ContactReason__c> contact_reason=[SELECT ID From ContactReason__c LIMIT 200];
delete contact_reason;

List<Solution__c> solutions=[SELECT ID From Solution__c LIMIT 200];
delete solutions;

List<Contact_information__c> contactInformations=[SELECT ID From Contact_information__c LIMIT 200];
delete contactInformations;

List<Country_Brand__c> countryBrands =[SELECT ID FROM Country_Brand__c LIMIT 200];
delete countryBrands;

List<Product_EAN__c> productEANs =[SELECT ID FROM Product_EAN__c LIMIT 200];
delete productEANs;

List<Axe_sous_axe__c> axe_sous_axes =[SELECT ID FROM Axe_sous_axe__c LIMIT 200];
delete axe_sous_axes;

List<Axe_CRM__c> axe_crms =[SELECT ID FROM Axe_CRM__c LIMIT 200];
delete axe_crms;

List<Sub_product_line__c> subBroductLines =[SELECT ID FROM Sub_product_line__c LIMIT 200];
delete subBroductLines;

List<Product_lines__c> productLines =[SELECT ID FROM Product_lines__c LIMIT 200];
delete productLines;

List<Brand__c> brands =[SELECT ID FROM Brand__c LIMIT 200];
delete brands;

List<Country__c> countries=[SELECT ID From Country__c LIMIT 200];
delete countries;

List<Customer_Care_Org__c> ccare_orgs=[SELECT ID From Customer_Care_Org__c LIMIT 200];
delete ccare_orgs;

List<Account> accounts=[SELECT ID From Account LIMIT 200];
delete accounts;