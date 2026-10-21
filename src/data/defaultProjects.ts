import type { Project } from '../types';

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-vigil-demo-node',
    name: 'E-Commerce Backend Microservice (Node.js)',
    description: 'Full-stack Node.js REST API with hardcoded secrets, SQL injection, and outdated vulnerable dependencies.',
    createdAt: new Date().toISOString(),
    githubRepo: 'vigil-org/ecommerce-node-api',
    githubBranch: 'main',
    files: [
      {
        path: 'src/server.js',
        name: 'server.js',
        language: 'javascript',
        content: `const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

// SECURITY ISSUE: Hardcoded AWS Access Credentials & Database Password
const AWS_ACCESS_KEY = "AKIA1234567890EXAMPLE";
const DB_HOST = "mysql://admin:P@ssw0rd2026!@localhost:3306/shop";
const JWT_SECRET = "super_secret_jwt_key_12345";

// SECURITY ISSUE: Overly Permissive CORS Policy
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// SECURITY ISSUE: SQL Injection in User Login
app.post('/api/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  // Vulnerable Query String Concatenation
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      const token = jwt.sign({ id: results[0].id }, "super_secret_jwt_key_12345");
      return res.json({ status: "success", token });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  });
});

// SECURITY ISSUE: Command Injection via system diagnostic endpoint
app.get('/api/ping', (req, res) => {
  const host = req.query.host;
  // Vulnerable to command execution: e.g., ?host=127.0.0.1;cat /etc/passwd
  exec("ping -c 1 " + host, (error, stdout, stderr) => {
    res.json({ output: stdout || stderr });
  });
});

// SECURITY ISSUE: Broken Weak Hashing Algorithm (MD5)
app.post('/api/hash-user', (req, res) => {
  const data = req.body.data;
  const hash = crypto.createHash('md5').update(data).digest('hex');
  res.json({ hash });
});

app.listen(3000, () => console.log("Server listening on port 3000"));
`
      },
      {
        path: 'src/auth/jwt.js',
        name: 'jwt.js',
        language: 'javascript',
        content: `const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send({ auth: false, message: 'No token provided.' });
  
  // Hardcoded secret key
  jwt.verify(token, 'super_secret_jwt_key_12345', function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    req.userId = decoded.id;
    next();
  });
}

module.exports = { verifyToken };
`
      },
      {
        path: 'package.json',
        name: 'package.json',
        language: 'json',
        content: `{
  "name": "ecommerce-backend-api",
  "version": "1.0.0",
  "description": "Vulnerable e-commerce microservice API",
  "main": "src/server.js",
  "dependencies": {
    "express": "4.16.0",
    "lodash": "4.17.15",
    "axios": "0.18.0",
    "jsonwebtoken": "8.5.1",
    "mysql2": "2.2.5"
  }
}
`
      }
    ]
  },
  {
    id: 'proj-vigil-demo-py',
    name: 'AI Analytics Service (Python Flask)',
    description: 'Python Flask data processing service containing pickle deserialization and hardcoded GitHub tokens.',
    createdAt: new Date().toISOString(),
    githubRepo: 'vigil-org/python-analytics-api',
    githubBranch: 'main',
    files: [
      {
        path: 'app.py',
        name: 'app.py',
        language: 'python',
        content: `import pickle
import os
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

# SECURITY ISSUE: Hardcoded GitHub PAT Token
GITHUB_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"

@app.route('/api/process_model', methods=['POST'])
def process_model():
    data = request.data
    # SECURITY ISSUE: Insecure Deserialization via pickle
    model_obj = pickle.loads(data)
    return jsonify({"status": "model_loaded"})

@app.route('/api/exec_script', methods=['POST'])
def exec_script():
    code_str = request.json.get('code')
    # SECURITY ISSUE: Dangerously evaluating dynamic code
    result = eval(code_str)
    return jsonify({"result": str(result)})

@app.route('/api/hash', methods=['POST'])
def generate_hash():
    input_val = request.json.get('text', '')
    # SECURITY ISSUE: Weak MD5 hashing
    h = hashlib.md5(input_val.encode()).hexdigest()
    return jsonify({"hash": h})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`
      },
      {
        path: 'requirements.txt',
        name: 'requirements.txt',
        language: 'plaintext',
        content: `flask==1.1.2
requests==2.20.0
log4j==2.14.1
numpy==1.19.0
`
      }
    ]
  }
];
