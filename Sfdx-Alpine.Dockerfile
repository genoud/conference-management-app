
# author: Genoud Magloire (mailto:magloiredjatio@gmail.com)

FROM maven:3.5.4-jdk-8




#ENV JAVA_HOME="/opt/java/current"

ENV ANT_OPTS="-Xmx256M"

ENV ANT_HOME="/usr/local/ant-1.10.5"

ENV PATH="${PATH}:${ANT_HOME}/bin"


#Install PMD

RUN wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F6.7.0/pmd-bin-6.7.0.zip \
        -O /tmp/pmd-bin-6.7.0.zip
RUN mkdir /usr/local/pmd-bin-6.7.0
RUN unzip /tmp/pmd-bin-6.7.0.zip -d /usr/local

#RUN echo "alias pmd='/usr/local/pmd-bin-6.7.0/bin/run.sh pmd'" >> /etc/bash.bashrc

#ADD aliases.sh /etc/profile.d/aliases.sh

#ENV ENV="/etc/profile.d"
RUN alias pmd="/usr/local/pmd-bin-6.7.0/bin/run.sh pmd"

#RUN ls -l /usr/local/pmd-bin-6.7.0

#RUN  pmd -h

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

# Node Js
RUN apk add --update nodejs nodejs-npm

# ADD resources/sfdx*.tar.gz /usr/local/
RUN wget --tries=3 \
        https://developer.salesforce.com/media/salesforce-cli/sfdx-linux-amd64.tar.xz \
        -O /tmp/sfdx.tar.gz 

RUN mkdir sfdx 

RUN tar xJf /tmp/sfdx.tar.gz -C sfdx --strip-components 1

RUN ./sfdx/install

RUN sfdx --version

RUN ant -version

#RUN pmd -h

ENTRYPOINT [""]

CMD ["alias pmd='/usr/local/pmd-bin-6.7.0/bin/run.sh pmd'"]


