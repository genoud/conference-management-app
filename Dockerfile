
# author: Genoud Magloire (mailto:magloiredjatio@gmail.com)

FROM ubuntu:18.04

ENV LANG="en_US.UTF-8" \
    LANGUAGE="en_US:en" \
    LC_ALL="en_US.UTF-8"

ENV JAVA_VERSION="1.8.0_181"


ENV JAVA_HOME="/opt/java/current"

ENV ANT_OPTS="-Xmx256M"

ENV ANT_HOME="/usr/local/ant-1.10.5"

ENV PATH="${PATH}:${JAVA_HOME}/bin:${ANT_HOME}/bin"

RUN apt-get update

RUN apt-get install -y curl software-properties-common sudo wget unzip
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

RUN apt-get install -y nodejs


RUN mkdir -p /opt/java

RUN wget --tries=3 \
        --header "Cookie: oraclelicense=accept-securebackup-cookie" \
        http://download.oracle.com/otn-pub/java/jdk/8u181-b13/96a7b8442fe848ef90c96a2fad6ed6d1/jdk-8u181-linux-x64.tar.gz \
        -O /tmp/jdk-8u181.tar.gz \
    && tar -zxf /tmp/jdk-8u181.tar.gz -C /opt/java

RUN ln -s /opt/java/jdk1.8.0_181 /opt/java/current



#Install PMD

RUN wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F6.7.0/pmd-bin-6.7.0.zip \
        -O /tmp/pmd-bin-6.7.0.zip
RUN mkdir /usr/local/pmd-bin-6.7.0
RUN unzip /tmp/pmd-bin-6.7.0.zip -d /usr/local/pmd-bin-6.7.0
RUN alias pmd="/usr/local/pmd-bin-6.7.0/pmd-bin-6.7.0/bin/run.sh pmd"

#Install ANT

RUN wget http://www-eu.apache.org/dist//ant/binaries/apache-ant-1.10.5-bin.tar.gz \
        -O /tmp/apache-ant.tar.gz 
RUN mkdir /usr/local/ant-1.10.5
RUN tar xvfz  /tmp/apache-ant.tar.gz  -C /usr/local/ant-1.10.5 --strip-components 1

RUN ant -version

# Install ant migration tools
RUN wget https://gs0.salesforce.com/dwnld/SfdcAnt/salesforce_ant_43.0.zip \
        -O /tmp/salesforce_ant_43.0.zip
RUN mkdir /usr/local/sfdc-ant
RUN unzip /tmp/salesforce_ant_43.0.zip -d /usr/local/sfdc-ant

# ADD resources/sfdx*.tar.gz /usr/local/
RUN wget --tries=3 \
        https://developer.salesforce.com/media/salesforce-cli/sfdx-linux-amd64.tar.xz \
        -O /tmp/sfdx.tar.gz 

RUN mkdir sfdx 

RUN tar xJf /tmp/sfdx.tar.gz -C sfdx --strip-components 1

RUN ./sfdx/install


