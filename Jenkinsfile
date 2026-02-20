pipeline {
    agent any

    tools {
        nodejs 'Node18'
    }

    stages {

        stage('Install') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Start') {
            steps {
                bat 'npm run start'
            }
        }
    }
}