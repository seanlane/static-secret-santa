const assert = require('assert');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const generator = require('generate-password');
const Mustache = require('mustache');

const Config = require('/config.json');
const People = require('./people.json');

console.log("Starting up");

function find_path(persons){
  var vertices = [];
  var temp = JSON.parse(JSON.stringify(persons));
  while (Object.keys(temp).length > 0) {
    var cur = Object.keys(temp)[0];
    var vertex = [];
    while (cur != null) {
      vertex.push(cur)
      cur = temp[cur].give_to
    }

    cur = temp[Object.keys(temp)[0]].receive_from
    while (cur != null) {
      vertex.unshift(cur)
      cur = temp[cur].give_to
    }

    vertices.push(vertex);
    for (key of vertex){
      delete temp[key];
    }
  }
  vertices = shuffle(vertices);
  var vert = vertices.pop();
  while (vertices.length > 0) {
    var tail = vert[vert.length - 1];
    var places = [];
    for (var i = 0; i < vertices.length; i++) {
      if (!persons[tail].nomatch.includes(vertices[i][0])) {
        places.push(i);
      }
    }

    if (places.length == 0) {
      return null;
    }

    places = shuffle(places);
    var index = places[0]
    vert = vert.concat(vertices[index]);
    vertices.splice(index, 1);
  }
 //console.log(vert);
  if (persons[vert[vert.length - 1]].nomatch.includes(vert[0])) {
    console.log("Tail can't give to head");
    return null;
  }
  return vert;
}

var links = null;
for (var i = 0; i < 100; i++) {
  links = find_path(People);
  if (links != null) {
    console.log("Number of tries to find path: ", i + 1);
    break;
  }
}

if (links == null) {
  console.log("Couldn't find a valid path after 100 tries");
  return -1;
}

for (var i = 0; i <  links.length; i++) {
  People[links[i]].give_to = links[(i+1) % links.length];
  People[links[(i+1) % links.length]].receive_from = links[i];
}

console.log("Assignments completed 🎄", links);

var assignment_template = fs.readFileSync('./templates/assignment.html', 'utf8');
Mustache.parse(assignment_template);   // optional, speeds up future uses

var crypt_template = fs.readFileSync('./templates/staticcrypt.html', 'utf8');
Mustache.parse(crypt_template);

var index_template = fs.readFileSync('./templates/index.html', 'utf8');
Mustache.parse(index_template); 

if (!fs.existsSync('./site')){
    fs.mkdirSync('./site');
}

links = links.sort();
var persons = [];
for (name of links) {
  persons.push({"name": name});
}

fs.writeFileSync('./site/index.html', Mustache.render(index_template, {"persons": persons}), 'utf-8'); 
copyFile('./images/logo.gif', './site/logo.gif');

for (person of Object.values(People)) {
  
  if (!fs.existsSync('./site/' + person.name)){
    fs.mkdirSync('./site/' + person.name);
  }

  var unencrypted = Mustache.render(assignment_template, {
      "name": person.give_to, 
      "date":Config.date
    });
  var passphrase = generator.generate({
    length: 15,
    numbers: true
  });

  person.password = passphrase;

  // Encrypt 
  var encrypted = CryptoJS.AES.encrypt(unencrypted, passphrase); 
  var hmac = CryptoJS.HmacSHA256(encrypted.toString(), CryptoJS.SHA256(passphrase)).toString();
  var encryptedMsg = hmac + encrypted;

  var params = {
    "instructions": Config.instructions,
    "encrypted": encryptedMsg, 
    "title": "🎄 " +  person.name + "'s Secret Santa Assignment"}
  var final = Mustache.render(crypt_template, params);

  var encryptedMsg = encryptedMsg,
    encryptedHMAC = encryptedMsg.substring(0, 64),
    encryptedHTML = encryptedMsg.substring(64),
    decryptedHMAC = CryptoJS.HmacSHA256(encryptedHTML, CryptoJS.SHA256(passphrase)).toString();

  if (decryptedHMAC !== encryptedHMAC) {
      console.log('Bad passphrase !');
      return;
  }
  var plainHTML = CryptoJS.AES.decrypt(encryptedHTML, passphrase).toString(CryptoJS.enc.Utf8);

  fs.writeFileSync('./site/' + person.name + '/index.html', final , 'utf-8'); 
}

var output = []

for (person of Object.values(People)) {
  output.push({
    'name': person.name,
    'email': person.email,
    'password': person.password
  })
}

var final = JSON.stringify(output);
fs.writeFileSync('final.json', final , 'utf-8'); 

function copyFile(src, dest) {

  let readStream = fs.createReadStream(src);

  readStream.once('error', (err) => {
    console.log(err);
  });

  readStream.once('end', () => {
    console.log('done copying');
  });

  readStream.pipe(fs.createWriteStream(dest));
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}