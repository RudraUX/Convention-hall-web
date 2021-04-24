//--------------------------MODULES----------------------------------
const fs = require('fs');
var replaceall = require('replaceall');
const http = require('http');
const os = require('os');
var crypto = require('crypto');
const url = require('url');
var ejs = require('ejs');
const chalk = require('chalk');
//-------------------------------------------------------------------
//-----------------------IP AND PORT INFO----------------------------
const hostname = '127.0.0.1';
const port = 8080;
//-------------------------------------------------------------------
//--------------------------MONGO DB----------------------------------
/**var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/convention', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
var conn = mongoose.connection;
conn.once('open', function () {});
conn.on('connected', function () {
  console.log(
    chalk.bold.rgb(255, 255, 51)('📡 Opening and connecting to MongoDB...')
  );
  console.log(
    chalk.bold.rgb(10, 250, 0)('🖥️  ------- MongoDB is connected -------')
  );
  console.log(
    chalk.bold.rgb(10, 250, 0)('---------------------------------------')
  );
});
conn.on('disconnected', function () {
  console.log(
    chalk.bold.rgb(255, 0, 0)('🖥️  ----- MongoDB is disconnected -----')
  );
});
conn.on('error', console.error.bind(console, 'connection error:'));
//---------------------------------------------------------------------
//----------------------MONGO DB SCHEMA------------------------
var userSchema = new mongoose.Schema({
  iglfname: { type: String },
  igllname: { type: String },
  teamname: { type: String },
  email_id: { type: String },
  password: { type: String },
  contactno: { type: String },
});
userSchema.index({
  iglfname: 'text',
  igllname: 'text',
  teamname: 'text',
  email_id: 'text',
  contactno: 'text',
});
User = mongoose.model('User', userSchema);
**/
//-------------------------------------------------------------
const server = http.createServer((req, res) => {
  //-----------FILE PATHS-----------------
  assets = './assets/';
  //--------------------------------------
  //---------------------------------------------------------------------------------------
  // all SEO related stuffs
  const robots = fs.readFileSync('./robots.txt', 'utf8');
  const sitemap = fs.readFileSync('./sitemap.xml', 'utf8');

  // all templates related stuffs
  const index = fs.readFileSync('index.html', 'utf8');

  //---------------------------------------------------------------------------------------

  var ip =
    (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress; //--------------------------------------> IP of Foreign Host

  console.log(
    chalk.bold.rgb(255, 102, 178)(time()) +
      ' | IP : ' +
      chalk.bold.rgb(255, 255, 0)(ip) +
      ' => ' +
      chalk.bold.rgb(255, 0, 0)(req.method) +
      ':' +
      chalk.bold.rgb(153, 255, 255)(req.url)
  ); //----------------> Log Info of Foreign Host with timestamp

  //-----------------------URL INFO------------------------------
  var add = `http://${hostname}:${port}${req.url}`;
  var q = url.parse(add, true);
  var path = q.pathname;
  //-------------------------------------------------------------
  //------------------ROUTING------------------------------------
  if (req.method == 'GET') {
    if (path == '/sitemap.xml') {
      route(res, 200, 'OK', sitemap, {});
    } else if (path == '/robots.txt') {
      route(res, 200, 'OK', robots, {});
    } else if (path == '/') {
      route(res, 200, 'OK', index, {});
    } else if (path.startsWith('/assets')) {
      value = path.substring(9);
      render(path, res);
    } else if (path.startsWith('/form')) {
      value = path.substring(6);
      render(path, res);
    } else {
      route(
        res,
        404,
        'Page Not Found',
        `<h1>No Page Found</h1> <br>${req.url} is not available`,
        {}
      );
    }
    //---------------------------------------------------------------
  } else if (req.method == 'POST') {
    if (path == '/log') {
      var body = '';
      req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
          body = '';
          res.writeHead(413, { 'Content-Type': 'text/plain' }).end();
          req.connection.destroy();
        }
      });
      req.on('end', function () {
        var post = JSON.parse(body);
        console.log(post);
        if (!(post.unique_id == '' || post.password == '')) {
          const hash_pass = crypto
            .createHash('sha256')
            .update(post.password)
            .digest('base64');
          User.exists(
            { unique_id: post.unique_id, password: hash_pass },
            function (err, docs) {
              if (err) {
                console.log(err);
              } else {
                if (docs) {
                  res.end('Done');
                } else {
                  res.end(
                    '<span style="color:red;font-size:15px">*Unique ID or Password is wrong</span>'
                  );
                }
              }
            }
          );
        } else {
          res.end(
            '<span style="color:red;font-size:15px">*Both Unique ID and Password Required</span>'
          );
        }
      });
    } else if (req.url == '/addproduct') {
      var form = new formidable.IncomingForm();
      form.multiples = true;
      form.parse(req, function (err, fields, files) {
        try {
          if (
            !(
              JSON.stringify(files) == '{}' ||
              fields.name == '' ||
              fields.brand == '' ||
              fields.details == '' ||
              fields.keywords == '' ||
              fields.quantity == '' ||
              fields.category == '' ||
              fields.type == '' ||
              fields.price == ''
            )
          ) {
            console.log('Fields info :');
            console.log(fields);
            var oldpath = files.image.path;
            var newpath = 'serverImages/products/' + files.image.name;
            console.log(
              "Image info : \n{\n name : '" +
                chalk.rgb(255, 255, 0)(files.image.name) +
                "',\n type : '" +
                chalk.rgb(102, 178, 255)(files.image.type) +
                "',\n path : '" +
                chalk.rgb(102, 178, 255)(newpath) +
                "',\n size : '" +
                chalk.rgb(255, 0, 0)(files.image.size + ' bytes') +
                "'\n}"
            );
            fs.rename(oldpath, newpath, function (err) {
              if (err) throw err;
              else {
                Items.insertMany(
                  {
                    name: fields.name,
                    brand: fields.brand,
                    model: fields.model,
                    imagepath: files.image.name,
                    details: fields.details,
                    keyword: fields.keywords,
                    price: fields.price,
                    quantity: fields.quantity,
                    category: fields.category,
                    type: fields.type,
                    color: fields.color,
                  },
                  function (err, result) {
                    if (err) {
                      res.end(err);
                    } else {
                      route(
                        res,
                        200,
                        'OK',
                        'text/plain',
                        '<span style="color:lime">This product has been successfully added.</span>',
                        {}
                      );
                    }
                  }
                );
              }
            });
          } else {
            route(
              res,
              200,
              'OK',
              'text/plain',
              '<span style="color:red">Please complete all fields.</span>',
              {}
            );
          }
        } catch (e) {}
      });
    } else if (path == '/sendmessage') {
      var body = '';
      req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
          body = '';
          res.writeHead(413, { 'Content-Type': 'text/plain' }).end();
          req.connection.destroy();
        }
      });
      req.on('end', function () {
        var post = JSON.parse(body);
        console.log(post);
        if (
          !(
            post.ign == '' ||
            post.rname == '' ||
            post.email == '' ||
            post.phone == '' ||
            post.message == ''
          )
        ) {
          post.email = post.email.trim();
          res.end('Message sent successfully');
          var sub = 'Message from Player';
          var body_html =
            '<h2 style="color:blue">Details</h2><br><table border="2px solid"><tr><th>Form Details :</th></tr><tr><td>In-Game Name : ' +
            post.ign +
            '</td></tr><tr><td>Real Name : ' +
            post.rname +
            '</td></tr><tr><td>Email ID : ' +
            post.email +
            '</td></tr><tr><td>Phone Number : ' +
            post.phone +
            '</td></tr><tr><td>Message : ' +
            post.message +
            '</td></tr></table>';
          email_reset_send('abirghoshmarch1999@gmail.com', sub, body_html);
        } else {
          res.end('Please fill up the form completely to send message to us');
        }
      });
    } else if (path == '/reset-pass') {
      var body = '';
      req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
          body = '';
          res.writeHead(413, { 'Content-Type': 'text/plain' }).end();
          req.connection.destroy();
        }
      });
      req.on('end', function () {
        var post = JSON.parse(body);
        console.log(post);
        if (!(post.unique_id == '')) {
          User.exists({ unique_id: post.unique_id }, function (err, docs) {
            if (err) {
              console.log(err);
            } else {
              if (docs) {
                var randomstring = Math.random().toString(36).substr(2, 8);
                const hash_pass = crypto
                  .createHash('sha256')
                  .update(randomstring)
                  .digest('base64');
                console.log('New password : ' + randomstring);

                User.updateOne(
                  { unique_id: post.unique_id },
                  { password: hash_pass },
                  function (err, result) {
                    if (err) {
                      res.send(err);
                    } else {
                      var sub = 'New password for Inventory System';
                      var body_html =
                        '<h2 style="color:blue">Details</h2><br><table border="2px solid"><tr><th>Parameters</th></tr><tr><td>Unique ID : ' +
                        post.unique_id +
                        '</td></tr><tr><td>Password : ' +
                        randomstring +
                        '</td></tr></table>';
                      email_reset_send(post.unique_id, sub, body_html);
                    }
                  }
                );
                res.end(
                  '<span style="color:lime">Your new password sent to your registered email.Please change it as soon as possible.</span>'
                );
              } else {
                res.end(
                  '<span style="color:red;font-size:15px">No such email id registered with us.</span>'
                );
              }
            }
          });
        }
      });
    }
  }
});

// Route Function
function route(res, statCode, statMsg, pageCont, ejsParams) {
  res.statusCode = statCode;
  res.statusMessage = statMsg;
  res.setHeader('Server', 'KaliServer');
  res.end(pageCont);
}

function email_reset_send(email, sub, body_html) {
  var nodemailer = require('nodemailer');
  var transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
      user: 'Subhajit7602501550@gmail.com',
      pass: 'subhajit08',
    },
  });
  const message = {
    from: 'Misra Op Gaming <Misra@misra.jprq.live>',
    to: email,
    subject: sub,
    html: body_html,
  };
  transport.sendMail(message, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(chalk.bold.rgb(102, 102, 255)(JSON.stringify(info)));
    }
  });
}

// Time Function
function time() {
  let date_ob = new Date();
  let date = ('0' + date_ob.getDate()).slice(-2);
  let month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();
  let time =
    '[' +
    year +
    '-' +
    month +
    '-' +
    date +
    ' ' +
    hours +
    ':' +
    minutes +
    ':' +
    seconds +
    ']';
  return time;
}

function render(path, res) {
  //console.log(path);
  path = replaceall('/', '\\', path + '');
  //console.log(path);
  fs.access(
    'c:\\Users\\RudraX\\Desktop\\convention\\' + path,
    fs.F_OK,
    (err) => {
      if (err) {
        console.error(err);
        route(res, 404, 'Page Not Found', 'No File', {});
      } else {
        const file = fs.readFileSync(
          'c:\\Users\\RudraX\\Desktop\\convention\\' + path
        );
        if (path.endsWith('.svg')) {
          res.statusCode = 200;
          res.statusMessage = 'OK';
          res.setHeader('Server', 'KaliServer');
          res.setHeader('Content-Type', 'image/svg+xml');
          res.end(file);
        } else {
          route(res, 200, 'OK', file, {});
        }
      }
    }
  );
}

server.listen(port, hostname, () => {
  console.log(chalk.cyanBright('---------------------------------------'));
  console.log(
    chalk.rgb(
      51,
      255,
      255
    )(
      `Server running at http://${hostname}:${port}/ \nOS Type : ${os.type()}\nArchitecture : ${os.arch()}`
    )
  );

  console.log(chalk.cyanBright('---------------------------------------'));
});
