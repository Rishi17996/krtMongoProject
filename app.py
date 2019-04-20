from flask import Flask, render_template, request
from pymongo import MongoClient
from gridfs import GridFS
import json
from bson import json_util
from bson.json_util import dumps
import re
from base64 import b64encode
import datetime

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
    fs = GridFS(connection[DBS_NAME])
    regex = re.compile("\\b"+ query +"\\b", re.IGNORECASE)
    projects = collection.find({'notes' : regex}).limit(1000)
    state_names = []
    states = []
    json_projects = []
    images = {}
    for project in projects:
        state_names.append(project.get("state"))
        json_projects.append(project)
    #print(state_names)
    for state in state_names:
        state = state.replace(" ", "")
        state = state + ".jpg"
        states.append(state)
    #print(states)
    for s in states:
        for grid_output in fs.find({'filename' : s}):
            img = b64encode(grid_output.read()).decode('utf-8')
            images[s] = img
    #for s in states:
    #    img = fs.get_version(s, 'rb').read()
    #    images[s] = img
    #print(images)
    #json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    #print(type(json_projects))
    #return json_projects
    return render_template('results.html' , result=json_projects, result2=images)

@app.route("/recordContent", methods=['GET', 'POST'])
def recordContent():
    data = request.form
    record = data['doc']
    return render_template('recordContent.html', result=record)

@app.route("/commentAdded", methods=['GET', 'POST'])
def commentAdded():
    data = request.form
    name = str(data['name'])
    comment = str(data['comment'])
    id = str(data['id'])
    print(comment)
    #date = datetime.datetime.now()
    return comment

if __name__ == "__main__":
    app.run(debug=True)
