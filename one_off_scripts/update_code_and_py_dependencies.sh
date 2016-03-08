#
# quick way to update code by pulling new code and removing and reinstalling virtual environment to install only python
# dependencies from python dependency file
#
# EXECUTE FROM ROOT OF PROJECT
#

git pull
rm -fr ./venv
virtualenv venv
. ./venv/bin/activate
pip install -r ./python_deps.txt
echo "Done"