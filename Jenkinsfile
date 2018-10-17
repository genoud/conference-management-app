import groovy.json.* 

@NonCPS
def jsonParse(def json) {
    return new groovy.json.JsonSlurperClassic().parseText(json)
}





def deployOnOrg(def orgAlias, def rootDir, def wait, def validate){
    def toolbelt = tool 'toolbelt'
    echo "Deploy on ${orgAlias}"
    def validateParam="";
    if (validate==true){
        validateParam="-c"
    }

    def deployJson = sh returnStdout: true, script: "sfdx force:mdapi:deploy -d ${rootDir} -u ${orgAlias} ${validateParam} --json --loglevel debug"

    def deployObject = jsonParse(deployJson)
    def jobId = deployObject.result.id
    echo "Deployment done, JOB ID ${jobId}"

    def deploySuccess = false
    def deployComplete=deployObject["result"]["done"];

    jsonSlurper=null
    deployObject=null;

    echo "Entering a loop to wait for deployment to finish"
    if (deployComplete == false && (wait==true || validate==true)){
        waitUntil {
            script {
                echo "Retrieving deploy result Job ID: ${jobId}"
                def reportResultJson = sh returnStdout: true, script: "sfdx force:mdapi:deploy:report -i ${jobId} -u ${orgAlias} --json --loglevel debug"
                def reportObj = jsonParse(reportResultJson)
                echo "Result parssed"
                if( reportObj["result"]["done"] == true){
                    echo "Deployement is completed"
                    deploySuccess = reportObj["result"]["success"]
                    reportObj=null
                    return true
                }
                else{
                    echo "Deployement is not completed loop once more"
                    echo "Sleep for one minutes"
                    sleep time: 1, unit: 'MINUTES'
                    echo "Wakeup from sleep and retry"
                    reportObj=null
                    return false
                }
            }
        }
    }
        
    if(deploySuccess==false && (wait==true || validate==true)){
        return false
    }
    return true
}


node {
    def mvnHome

    def BUILD_NUMBER=env.BUILD_NUMBER

    def SFDC_USERNAME
    
    def SCRATCH_ORG_NAME="${env.SCRATCH_ORG}-${env.JOB_BASE_NAME}-${BUILD_NUMBER}"
    def DEV_HUB_ORG_NAME=env.DEV_HUB_ORG
    def RUN_ARTIFACT_DIR="tests/${BUILD_NUMBER}"
    def BUILD_STATUS="SUCCESS"

    try{
        stage('checkout'){
            cleanWs notFailBuild: true

            checkout scm

            //rc = sh returnStatus: true, script: "apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget"
            

            //rc = sh returnStatus: true, script: "sfdx update "

            echo "BRANCH_CONFIG.sonar_project_name ${BRANCH_CONFIG.sonar_project_name}"
            dir('utils/sfdx-plugins/acn') {
                echo 'Linking sfdx plugin'

                rc = sh returnStatus: true, script: "sfdx plugins:uninstall acn "

                rc = sh returnStatus: true, script: "rm -rf ~/.local/share/sfdx/linked_plugins.json"

                rc = sh returnStatus: true, script: "sfdx plugins:link . "
                //if (rc != 0) { error 'Error linking sfdx plugin' }
                echo 'sfdx plugin linked '
            }
        }
        withCredentials([file(credentialsId: 'sfdc_dev_hub_jwt_key_file_id', variable: 'sfdc_dev_hub_jwt_key_file'),
                        usernamePassword(credentialsId: 'sfdc_dev_hub_consumer_key_id', passwordVariable: 'sfdc_dev_hub_consumer_key', usernameVariable: 'sfdc_dev_hub_consumer_key_username'),
                        usernamePassword(credentialsId: 'sfdc_sandbox_consumer_key_id', passwordVariable: 'sfdc_sandbox_consumer_key', usernameVariable: 'sfdc_sandbox_consumer_key_username'),
                        usernamePassword(credentialsId: 'sfdc_deploy_org_consumer_key_id', passwordVariable: 'sfdc_deploy_org_consumer_key', usernameVariable: 'sfdc_deploy_org_consumer_key_username')
                        ]) {
            stage('Initialisation') { // for display purposes
            
                echo 'Preparing'

                //Login to DevHub
                echo "Login to DevHub ${DEV_HUB_ORG_NAME}"

                rc = sh returnStatus: true, script: "sfdx force:auth:jwt:grant --clientid ${sfdc_dev_hub_consumer_key} --username ${sfdc_dev_hub_consumer_key_username} --jwtkeyfile ${sfdc_dev_hub_jwt_key_file}  --setdefaultdevhubusername -a ${DEV_HUB_ORG_NAME}"
                if (rc != 0) { 
                    error 'hub org authorization failed' 
                }
                
                //Creation de la scratch org
                echo "create scratch org"

                rc = sh returnStatus: true, script: "sfdx force:org:create -v ${DEV_HUB_ORG_NAME} -s -f config/project-scratch-def.json -a ${SCRATCH_ORG_NAME} --json --setdefaultusername "
                

            }
            stage('Build') {
               
                echo "Building"
                try {
                    
                    
                    rc = sh returnStatus: true, script: "sfdx force:source:push -u ${SCRATCH_ORG_NAME} --loglevel debug "
                    
                    if (rc != 0) {
                        error 'push standard object configs failed'
                    }
                    


                    rc = sh returnStatus: true, script: "sfdx force:user:permset:assign --targetusername ${SCRATCH_ORG_NAME} --permsetname Conference_App_User --loglevel debug"
                    if (rc != 0) {
                        error 'assign permissionset failed'
                    }  

                } catch (Exception e) {
                    echo "An error occured: ${e.message}"
                    rc = sh returnStatus: true, script: "sfdx force:org:delete -u ${SCRATCH_ORG_NAME} -p --loglevel debug"
                    //sh "sfdx force:auth:logout -u ${DEV_HUB_ORG_NAME} -p" 
                    throw e; // rethrow so the build is considered failed                        
                } 
                
                
            }
            stage('Run Apex Test') {
                
                echo "Run tests"
                
                sh "mkdir -p ${RUN_ARTIFACT_DIR}"
                timeout(30) {
                    rc = sh returnStatus: true, script: "sfdx force:apex:test:run --testlevel RunLocalTests --outputdir ${RUN_ARTIFACT_DIR} --resultformat tap --targetusername ${SCRATCH_ORG_NAME} --synchronous -w 30 --loglevel debug"
                    junit keepLongStdio: true, testResults: 'tests/**/*-junit.xml'
                    
                }                
            }
            stage('Build Artifact') {
                echo "Building artifact"

                //def lastTag = sh returnStdout: true, script: 'git describe --tags  --abbrev=0'

                if(env.CHANGE_ID) {
                    // do something because it's a pull request
                    echo "No artifact build on pull request"
                } else {
                    // not a pull request
                    //checkout([$class: "GitSCM", branches: [[name: "${BRANCH_CONFIG.target_branch}"]], doGenerateSubmoduleConfigurations: false, extensions: [], gitTool: "", submoduleCfg: [], userRemoteConfigs: [[credentialsId: "BITBUCKET_CRED_ID", url: "https://bitbucket.e-loreal.com/scm/emea-c1/emea-c1-salesforce-sfdx-ccare.git"]]])
                    //git branch: "${BRANCH_CONFIG.target_branch}", credentialsId: 'BITBUCKET_CRED_ID', url: 'https://bitbucket.e-loreal.com/scm/emea-c1/emea-c1-salesforce-sfdx-ccare.git'

                    //Fetch source from the target branch to build the diff
                    def targetBranch="master"
                    
                    git branch: "master", credentialsId: 'GITHUB_CRED', url: 'https://github.com/genoud/conference-management-app.git'
   
                    

                    sh "git checkout ${env.BRANCH_NAME}"

                    sh "git diff --raw ${targetBranch}...${env.BRANCH_NAME} > diff.txt"
                
                    sh "mkdir dist"
                    
                    sh "sfdx acnforce:project:diff -f diff.txt -d dist --loglevel debug "

                    sh "cp sfdx-project.json dist"
                    def built = false
                    dir('dist') {
                        def files = findFiles(glob: 'force-app/**')
                        def isDestructive = fileExists 'destructiveChangesPost.xml'
                        if(files.length>0){
                            sh "sfdx force:source:convert  -r force-app -d deployment-package --loglevel debug"
                            if(isDestructive){
                                rc = sh returnStatus: true, script: "cp -r ./destructiveChangesPost.xml ./deployment-package"
                            }
                            zip archive: true, dir: "deployment-package", glob: "", zipFile: "${env.BRANCH_NAME}-${BUILD_NUMBER}.deployment.zip"
                        }
                        else if(isDestructive){
                            rc = sh returnStatus: true, script: "mkdir deployment-package"
                            rc = sh returnStatus: true, script: "cp -r ./destructiveChangesPost.xml ./deployment-package"
                            rc = sh returnStatus: true, script: "cp -r ../package.xml ./deployment-package"
                            zip archive: true, dir: "deployment-package", glob: "", zipFile: "${env.BRANCH_NAME}-${BUILD_NUMBER}.deployment.zip"
                        }
                    }
                    
                }
            }
            stage('Package Validation') {
                
                
                echo "Deploy on sandbox Remembre to setup the deployement sandbox"

                echo "Login to sandbox"

                //sh "sfdx force:source:convert -d mdapi/src -r force-app --loglevel debug"
                
                //rc = sh returnStatus: true, script: "cp -r destructiveChangesPost.xml/* ./mdapi/src"

                def files = findFiles(glob: 'dist/deployment-package/**')
                if(files.length>0){
                    sh "sfdx force:auth:jwt:grant --clientid ${sfdc_deploy_org_consumer_key} --username ${sfdc_deploy_login} --jwtkeyfile ${sfdc_deploy_jwt_key_file}  -a deploy -r ${BRANCH_CONFIG.sfdc_deploy_org_url} --loglevel debug"

                    deploySuccess=deployOnOrg('deploy', 'dist/deployment-package', true, true);
                    if(deploySuccess==false){
                        error "Package validation failled"
                    }
                    else{
                        echo "Package successfully validated"
                    }

                }
                //rc = sh returnStatus: true, script:  "sfdx force:auth:logout -u deploy -p"
                
                
            }
            stage('Analyse') {
                sh returnStatus: true, script: 'pmd -d force-app -l apex -reportfile report/output.csv -f csv -R config/ruleset.xml'
                sh returnStatus: true, script: 'pmd -d force-app -l apex -reportfile report/output.xml -f xml -R config/ruleset.xml'
                pmd canComputeNew: false, canRunOnFailed: true, defaultEncoding: '', healthy: '', pattern: 'report/output.xml', unHealthy: ''
            }
            stage('Deploy') {
                
                echo "Deploy on sandbox Remembre to setup the deployement sandbox"

                //Login to sandbox
                def files = findFiles(glob: 'dist/deployment-package/**')
                if(files.length>0){

                    echo "Login to sandbox"

                    sh "sfdx force:auth:jwt:grant --clientid ${sfdc_deploy_org_consumer_key} --username ${sfdc_deploy_login} --jwtkeyfile ${sfdc_deploy_jwt_key_file}  -a deploy -r ${BRANCH_CONFIG.sfdc_deploy_org_url} --loglevel debug"

                    def deploySuccess = false

                    deploySuccess = deployOnOrg('deploy', 'dist/deployment-package', true, false);
                    if(deploySuccess == false){
                        error 'Deploying on sandbox failled'
                    }
                }
                
                        
            }
            stage('Clean') {
                echo "Clean up"


                rc = sh returnStatus: true, script: "sfdx force:org:delete -u ${SCRATCH_ORG_NAME} -p --loglevel debug"
                currentBuild.result = 'SUCCESS'
            }
            
        }
    }
    catch(err){
        //echo "Build fail:  ${err} ${currentBuild.absoluteUrl}"
        BUILD_STATUS='FAILURE'
        currentBuild.result = 'FAILURE'
        error 'Build failled'
        rc = sh returnStatus: true, script: "sfdx force:org:delete -u ${SCRATCH_ORG_NAME} -p --loglevel debug"
    }
    finally{

        echo "Sent email"
        /*
        def authorEmail = sh returnStdout: true, script: 'git log -1 --format="%ae"'
        def ccEmails=env.CC_EMAILS.replaceAll(';',', cc:')

        def mailRecipients = authorEmail+", cc:"+ccEmails
        def jobName = currentBuild.fullDisplayName
        def templatePath="${env.WORKSPACE}/config/groovy-html.template"
        def emailBody="\${SCRIPT, template=\"${templatePath}\"}"
   
*/
    
        cleanWs notFailBuild: false
    }
   
  
}