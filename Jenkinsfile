pipeline {
    agent { docker { image 'genoud6/sfdx-ci:v1.1' } }
    stages {
        stage('build') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'java -version'
                sh 'ant -version'
                sh 'sfdx --version'
                
            }
        }
    }
}