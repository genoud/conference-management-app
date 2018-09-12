pipeline {
    agent { 
        docker { 
            image 'genoud6/sfdx-ci:v1.1'
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
                sh 'sfdx force:source:convert -r force-app -d mdapi'
            }
        }
    }
}