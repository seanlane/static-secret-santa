# Static Secret Santa

Creates a static website for a Secret Santa group, and then distributes passwords for everyone's encrypted page via email (SMTP).

This is a fairly rough project, but I cranked it out over a few hours on a weekend and it meets my needs. I wanted to publish it in case anyone else could make use of it. It could easily be extended in a number of different ways, or simply be improved. 

## Dependencies

This project depends on NodeJS and npm. I used version 8.4.0, but anything fairly recent to 2017 should work. As for packages, the project shouldn't strictly be version specific, but these are the versions I used:

| Name | Version | Reason |
|------|---------|--------|
| crypto-js | ^3.1.9-1 | Encrypts/decrypts assignment pages |
| generate-password | ^1.3.0 | Self-explanatory |
| mustache | ^2.3.0 | Render HTML templates used |
| nodemailer | ^4.0.1 | Emails passwords to be used on assignment page |

## Sources of Inspiration

I was mainly inspired and used the code from two main projects:

1. [Buildkite's](https://buildkite.com/) project [Buildkite Secret Santa 2016](https://github.com/buildkite/buildkite-secret-santa-2016)
2. [Robin Moisson's](https://github.com/robinmoisson) project [staticcrypt](https://github.com/robinmoisson/staticrypt), which I saw on [Hacker News](https://news.ycombinator.com/item?id=14553401)

I also utilized a CodePen, [Nicky Christensen's](https://codepen.io/NickyCDK) [CSS3 Snow Animation](https://codepen.io/NickyCDK/pen/AIonk), which I thought added some extra flair.

## Installation

Install NodeJS, clone this project, and then from within the root directory of the project run `npm install`.

## Setup and Use

A number of things need to be configured. First, the information needed should be placed in the `people.json` file. It is a key/value pair file, where the name of each person is the key and that along with other information is the value as a JSON object. The names are expected to be unique. There are fields to manually assign someone if you would like to do so, otherwise leave them as `null`. An example of this can be seen, where Amy has been assigned to Mildred already, and Mildred is marked accordingly as receiving from Amy. You can also indicate persons that should not be matched together, like siblings, spouses, etc. Just add them to the array of `nomatch`, and they will not be matched together.

Second, you'll need to change the configuration parameters in `config.json`:

* `date` will be the delievery date inserted into each assignment page template
* `instructions` will be inserted into the prompt on the encrypted page, so instruct your users to decrypt the page with the passwords received via email
* `url` is the URL where the static site will reside
* `email_host`, `email_user`, `email_pass` are the hostname, username, and password are the respective fields needed to login and send email via an SMTP server. For instructions on how to obtain and use those, please visit the Support section of your email provider.

Once all that is done, run `node index.js` to generate all of the matches, passwords, and site materials. Copy the contents of the `site` folder to your web server for hosting, it's good to go.

Lastly, run `email.js` to email the passwords to all of the participants.

## Algorithm

Interestingly enough, Secret Santa is an NP-complete problem, since it is the same as finding a Hamiltonian Path in a graph. Each person is a node, and where there are links leaving this node are people whom this person can give to. My algorithm used is ugly, but gets the job done for the time being.

First, it couples together any nodes manually linked in `people.json` and interprets them as one node. Then, we greedily take the nodes and try to find a path. If the current node has multiple paths it can choose from, we shuffle the possibilites and pick one. If we cannot find a valid path, it returns and tries it again, up to 100 times (as currently hard coded).

I made this for a group of 8 people, and it works fine. I would assume that as long as the graph isn't too sparse, it should produce a valid path within a couple of tries, but that should probably be tested further.

## Conclusion

I hope this is useful for someone else, and feel free to contribute :)


