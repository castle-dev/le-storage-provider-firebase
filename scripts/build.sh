#!/bin/bash
type=$(git show | grep -oE '[^ ]+$' | tail -1)
if [ $type = "major" ] || [ $type = "minor" ] || [ $type = "patch" ]
then
git checkout develop
gulp bump:$type
git remote set-url origin "https://${GH_TOKEN}@github.com/castle-dev/le-storage-provider-firebase.git"
git push origin develop
git push origin develop --tags
gulp docs
cd docs
git init
git remote add origin "https://${GH_TOKEN}@github.com/castle-dev/le-storage-provider-firebase.git"
git checkout -B gh-pages
git add .
git commit -m "Updating documentation"
git push origin gh-pages -fq > /dev/null
fi
