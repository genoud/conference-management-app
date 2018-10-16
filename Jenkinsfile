pipeline {
    agent any
    stages {
        withCredentials([file(credentialsId: 'sfdc_dev_hub_jwt_key_file_id', variable: 'sfdc_dev_hub_jwt_key_file'),
                        usernamePassword(credentialsId: 'sfdc_dev_hub_consumer_key_id', passwordVariable: 'sfdc_dev_hub_consumer_key', usernameVariable: 'sfdc_dev_hub_consumer_key_username'),
                        usernamePassword(credentialsId: 'sfdc_sandbox_consumer_key_id', passwordVariable: 'sfdc_sandbox_consumer_key', usernameVariable: 'sfdc_sandbox_consumer_key_username'),
                        usernamePassword(credentialsId: 'sfdc_deploy_org_consumer_key_id', passwordVariable: 'sfdc_deploy_org_consumer_key', usernameVariable: 'sfdc_deploy_org_consumer_key_username')
                        ]) {

            stage('build') {
                steps {
                    sh 'npm --version'
                    sh 'java -version'
                    sh 'ant -version'
                    sh 'sfdx --version'
                }
            }
            stage('test') {
                steps {
                    sh 'echo run test'
                }
            }
            stage('analyse') {
                steps {
                    script {
                        // some block

                        def reportExist= fileExists 'report'
                        if(reportExist==false){
                            sh 'mkdir report'
                        }
                    
                        sh returnStatus: true, script: 'pmd -d force-app -l apex -reportfile report/output.csv -f csv -R config/ruleset.xml'
                        sh returnStatus: true, script: 'pmd -d force-app -l apex -reportfile report/output.xml -f xml -R config/ruleset.xml'
                        pmd canComputeNew: false, canRunOnFailed: true, defaultEncoding: '', healthy: '', pattern: 'report/output.xml', unHealthy: ''
                    }
                
                }
            }
        }
        
    }
}