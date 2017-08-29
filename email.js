'use strict';
const fs = require('fs');
const nodemailer = require('nodemailer');
const Mustache = require('mustache');

const Config = require('/config.json');
const People = require('./final.json');

var template = fs.readFileSync('./templates/email_template.html', 'utf8');
Mustache.parse(template);

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: Config.email_host,
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: Config.email_user,
        pass: Config.email_pass
    }
});

console.log(People);

for (var person of People) {
	var rendered = Mustache.render(template, {
		password: person.password,
		url: Config.url
	});

	// Setup email data with unicode symbols
	let mailOptions = {
	    from: '"🎄 Santa 🎅" <' + Config.email_user + '>', // sender address
	    to: person.name + ', ' + person.email, // list of receivers
	    subject: '🎅 Ho Ho Ho 🎄', // Subject line
	    html: rendered // html body
	};
	
	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
	    if (error) {
	        return console.log(error);
	    }
	    console.log('Message %s sent: %s', info.messageId, info.response);
	});
}