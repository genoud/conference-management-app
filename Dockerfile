
# author: Genoud Magloire (mailto:magloiredjatio@gmail.com)

FROM alpine:3.8

# A few reasons for installing distribution-provided OpenJDK:
#
#  1. Oracle.  Licensing prevents us from redistributing the official JDK.
#
#  2. Compiling OpenJDK also requires the JDK to be installed, and it gets
#     really hairy.
#
#     For some sample build times, see Debian's buildd logs:
#       https://buildd.debian.org/status/logs.php?pkg=openjdk-8

# Default to UTF-8 file.encoding
ENV LANG C.UTF-8

ENV ANT_OPTS="-Xmx256M"

ENV ANT_HOME="/usr/local/ant-1.10.5"

ENV PATH="${PATH}:${ANT_HOME}/bin"


# add a simple script that can auto-detect the appropriate JAVA_HOME value
# based on whether the JDK or only the JRE is installed
RUN { \
		echo '#!/bin/sh'; \
		echo 'set -e'; \
		echo; \
		echo 'dirname "$(dirname "$(readlink -f "$(which javac || which java)")")"'; \
	} > /usr/local/bin/docker-java-home \
	&& chmod +x /usr/local/bin/docker-java-home
ENV JAVA_HOME /usr/lib/jvm/java-1.8-openjdk
ENV PATH $PATH:/usr/lib/jvm/java-1.8-openjdk/jre/bin:/usr/lib/jvm/java-1.8-openjdk/bin

ENV JAVA_VERSION 8u171
ENV JAVA_ALPINE_VERSION 8.171.11-r0

RUN set -x \
	&& apk add --no-cache \
		openjdk8="$JAVA_ALPINE_VERSION" \
	&& [ "$JAVA_HOME" = "$(docker-java-home)" ]

# If you're reading this and have any feedback on how this image could be
# improved, please open an issue or a pull request so we can discuss it!
#
#   https://github.com/docker-library/openjdk/issues

RUN java -version

RUN apk add --no-cache curl tar bash procps

ARG MAVEN_VERSION=3.5.4
ARG USER_HOME_DIR="/root"
ARG SHA=ce50b1c91364cb77efe3776f756a6d92b76d9038b0a0782f7d53acf1e997a14d
ARG BASE_URL=https://apache.osuosl.org/maven/maven-3/${MAVEN_VERSION}/binaries

RUN mkdir -p /usr/share/maven /usr/share/maven/ref \
  && curl -fsSL -o /tmp/apache-maven.tar.gz ${BASE_URL}/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
  && echo "${SHA}  /tmp/apache-maven.tar.gz" | sha256sum -c - \
  && tar -xzf /tmp/apache-maven.tar.gz -C /usr/share/maven --strip-components=1 \
  && rm -f /tmp/apache-maven.tar.gz \
  && ln -s /usr/share/maven/bin/mvn /usr/bin/mvn

ENV MAVEN_HOME /usr/share/maven
ENV MAVEN_CONFIG "$USER_HOME_DIR/.m2"

RUN mvn -version

#Install PMD

RUN wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F6.7.0/pmd-bin-6.7.0.zip \
        -O /tmp/pmd-bin-6.7.0.zip
RUN mkdir /usr/local/pmd-bin-6.7.0
RUN unzip /tmp/pmd-bin-6.7.0.zip -d /usr/local

RUN alias pmd="/usr/local/pmd-bin-6.7.0/bin/run.sh pmd"

#Install ANT

RUN wget http://www-eu.apache.org/dist//ant/binaries/apache-ant-1.10.5-bin.tar.gz \
        -O /tmp/apache-ant.tar.gz 
RUN mkdir /usr/local/ant-1.10.5
RUN tar xvfz  /tmp/apache-ant.tar.gz  -C /usr/local/ant-1.10.5 --strip-components 1


# Install ant migration tools
RUN wget https://gs0.salesforce.com/dwnld/SfdcAnt/salesforce_ant_43.0.zip \
        -O /tmp/salesforce_ant_43.0.zip
RUN mkdir /usr/local/sfdc-ant
RUN unzip /tmp/salesforce_ant_43.0.zip -d /usr/local/sfdc-ant

# Node Js
RUN apk add --update nodejs nodejs-npm
RUN apk add --update --no-cache git openssh ca-certificates openssl jq gettext xmlstarlet

RUN npm i npm@latest -g

# install latest sfdx from npm
RUN npm install sfdx-cli --global
RUN sfdx --version
RUN sfdx plugins --core


#CMD [ "alias pmd='/usr/local/pmd-bin-6.7.0/bin/run.sh pmd'" ]
RUN echo 'alias pmd="/usr/local/pmd-bin-6.7.0/bin/run.sh pmd"' >> ~/.bashrc

RUN echo -e '#!/bin/bash\n/usr/local/pmd-bin-6.7.0/bin/run.sh pmd "$@"' > /usr/bin/pmd && \
    chmod +x /usr/bin/pmd

RUN ssh-keygen -t rsa -b 4096 -C "magloiredjatio@gmail.com"

