pipeline {
    agent { 
        docker { 
            image 'genoud6/sfdx-ci:v1.2'
            args '-u root'
        } 
    }
    stages {
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
                sh 'mkdir report'
                sh 'pmd -d force-app -l apex -reportfile report/output.csv -f csv -R config/ruleset.xml'
            }
        }
    }
}