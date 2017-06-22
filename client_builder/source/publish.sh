#!/bin/bash

if [ `uname` == 'Darwin' ]; then
        SED=gsed
        READLINK=greadlink
else
        SED=sed
        READLINK=readlink
fi

CLIENT_ROOT=$(dirname $($READLINK -f "$0"))

echo 'checking current verion...'
CURRENT_VERSION=$(npm show 'qweb-client' version)

if [[ $CURRENT_VERSION =~ ([0-9]+)$ ]]; then
    NEW_VERSION=$(echo $CURRENT_VERSION | $SED -e 's/\([0-9]\+\)$/'$(($BASH_REMATCH + 1))'/g')
else
    NEW_VERSION='1.0.0'
fi

echo 'current version is v'${CURRENT_VERSION}', publishing v'${NEW_VERSION}' ...'
$SED -i 's/"version":\s*".\+\?"/"version": "'${NEW_VERSION}'"/g' ${CLIENT_ROOT}/package.json
cd ${CLIENT_ROOT} && npm publish
echo 'done'