from flask import Flask, render_template, request
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps
import re

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'GunViolence'
COLLECTION_NAME = 'Incidents'
FIELDS = {'state': True, 'n_killed': True, 'n_injured': True, 'date': True, '_id': False}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/GunViolence/AllData")
def gunViolence_projects():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]

    projects = collection.find(projection=FIELDS, limit=10000)
    #projects = collection.find(projection=FIELDS)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects

@app.route("/results", methods=['GET', 'POST'])
def results():
    data = dict(request.form)
    #print(data)
    query = data['user_query']
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    regex = re.compile("\\b"+ query +"\\b", re.IGNORECASE)
    projects = collection.find({'notes' : regex}).limit(1000);
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    print(json_projects)
    return render_template('results.html' ,json_projects)

if __name__ == "__main__":
    app.run(debug=True)
