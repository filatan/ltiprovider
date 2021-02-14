/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
const express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
const cfenv = require('cfenv');

const uuid = require("uuid4");
const lti = require("ims-lti");


const fs = require('fs');

const loki = require('lokijs');

let db = new loki('database.db');
let users = db.addCollection('users');

// Declaración de las páginas HTML
let mod2File = fs.readFileSync("mod2.html", "utf8");
let mod3File = fs.readFileSync("mod3.html", "utf8");
let classpipFile = fs.readFileSync("classpip.html", "utf8");
let cuestionariosFile = fs.readFileSync("cuestionarios.html", "utf8");
let cuestionarioFile = fs.readFileSync("cuestionario.html", "utf8");
let loginClasspipFile = fs.readFileSync("loginClasspip.html", "utf8");
let gradeFile = fs.readFileSync("grade.html", "utf8");
let avatarFile = fs.readFileSync("avatar.html", "utf8");
let alumnosFile = fs.readFileSync("alumnos.html", "utf8");
let profesoresFile = fs.readFileSync("profesores.html", "utf8");


// create a new express server
var app = express();

// Necessary because IBM Cloud apps run behind a proxy
app.enable('trust proxy');


let sessions = {};

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.post("*", require("body-parser").urlencoded({extended: true}));


// Test functions
app.post("/module_1", (req, res) => {
	
	var moodleData = new lti.Provider("top", "secret");
	moodleData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}
		
		var sessionID = uuid();
		sessions[sessionID] = moodleData;
		
		res.send(moodleData.body);
	});   // moodleDate.valid_request
	
});       // app.post("/module_1");
app.post("/module_2", (req, res) => {
	var moodleData = new lti.Provider("top", "secret");
	moodleData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}
		
		var sessionID = uuid();
		sessions[sessionID] = moodleData;
	
		var sendMe = mod2File.toString().replace("//PARAMS**GO**HERE",
				`
					var params = {
						sessionID: "${sessionID}",
						user: "${moodleData.body.ext_user_username}",
						nombre: "${moodleData.body.lis_person_name_given}",
						apellido: "${moodleData.body.lis_person_name_family}"
					};
				`);

		res.setHeader("Content-Type", "text/html");
		res.send(sendMe);
	});   // moodleDate.valid_request
	
});       // app.post("/module_2");
app.post("/module_3", (req, res) => {
	var moodleData = new lti.Provider("top", "secret");
	moodleData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}
		
		var sessionID = uuid();
		sessions[sessionID] = moodleData;
	
		var sendMe = mod3File.toString().replace("//PARAMS**GO**HERE",
				`
					var params = {
						sessionID: "${sessionID}",
						user: "${moodleData.body.ext_user_username}",
						nombre: "${moodleData.body.lis_person_name_given}",
						apellido: "${moodleData.body.lis_person_name_family}"
						
					};
				`);

		res.setHeader("Content-Type", "text/html");
		res.send(sendMe);
	});   // moodleDate.valid_request
	
});       // app.post("/module_3");

/**
 * Carga página prinicipal
 */
app.post("/classpip", (req, res) => {

	var moodleData = new lti.Provider("top", "secret");
	moodleData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}

		var sessionID = uuid();
		sessions[sessionID] = moodleData;

		//Guardar en db.json usuario

		let username = moodleData.body.ext_user_username;

		async function getClasspipUser(username) {
			var user = users.findOne({ username:username });


			//Usuario no encontrado abrimos el formulario de autenticación
			if(!user) {
				console.log("Usuario "+ username +" no encontrado en la BBDD")
				var sendMe = loginClasspipFile.toString().replace("//PARAMS**GO**HERE",
					`
					var params = {
						sessionID: "${sessionID}",
						user: "${moodleData.body.ext_user_username}",
						nombre: "${moodleData.body.lis_person_name_given}",
						apellido: "${moodleData.body.lis_person_name_family}"
					}; 
				`);

				res.setHeader("Content-Type", "text/html");
				res.send(sendMe);
			}
			else{
				console.log("Usuario "+ username +" encontrado en la BBDD");
				//Usuario encontrado en la BBDD abrimos la página prinicipal de Classpip
				let usuario;

				async function getUser(callback) {
					//Obtener el alumno de classpip services
					const https = require('https');

					var url = "https://secret-dawn-80749.herokuapp.com/api/Alumnos?filter=%7B%22where%22%3A%7B%22Nombre%22%3A%22" + user.nombre + "%22%2C%22PrimerApellido%22%3A%22" + user.apellido + "%22%7D%7D";

					https.get(url, (resp) => {
						let data = '';

						let dataParsed;
						// A chunk of data has been receive
						resp.on('data', (chunk) => {
							data += chunk;
						});

						// The whole response has been received. Print out the result.
						resp.on('end', () => {
							console.log(JSON.parse(data));
							dataParsed = JSON.parse(data);

							usuario = dataParsed[0];
							console.log(usuario);
							callback (usuario);
						});


					}).on("error", (err) => {
						console.log("Error: " + err.message);
					});
				};

				getUser(function(usuario) {

					if (usuario !== undefined) {

						let sendMe = classpipFile.toString().replace("//PARAMS**GO**HERE",
							`
						var params = {
						sessionID: "${sessionID}",
						user: "${username}",
						nombre: "${usuario.Nombre}",
						apellido: "${usuario.PrimerApellido}",
						identificador: "${usuario.id}",
						imagenPerfil: "${usuario.ImagenPerfil}"
						}; 
				`);

						res.setHeader("Content-Type", "text/html");
						res.send(sendMe);
					}
				});
			}

		}

		getClasspipUser(username);


	});

});

/**
 * Login Function
 */
app.get("/login/:sessionID/:user/:nombre/:apellido/:username/:password", (req, res) => {
	let sessionID = req.params.sessionID;
	let user = req.params.user;
	let nombre = req.params.nombre;
	let apellido = req.params.apellido;
	let username = req.params.username;
	let password = req.params.password;

	let usuario;

	async function getUser(callback) {
		//Obtener el alumno de classpip services
		const https = require('https');

		var url = "https://secret-dawn-80749.herokuapp.com/api/Alumnos?filter=%7B%22where%22%3A%7B%22Nombre%22%3A%22" + username + "%22%2C%22PrimerApellido%22%3A%22" + password + "%22%7D%7D";
		console.log ("******************** " + url + "******************** ")
		https.get(url, (resp) => {
			let data = '';

			let dataParsed;
			// A chunk of data has been receive
			resp.on('data', (chunk) => {
				data += chunk;
			});

			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				console.log(JSON.parse(data));
				dataParsed = JSON.parse(data);

				usuario = dataParsed[0];
				console.log(usuario);
				callback (usuario);
			});


		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	};

	async function storeClasspipUser(user, nombreUsuario, contrasenya)
	{
		console.log("Guardamos el usuario en la BBDD");
		//await storage.init({ logging: true, ttl: false});
		//await storage.setItem('user', [username, password]);
		users.insert({
			username: user,
			nombre: nombreUsuario,
			apellido: contrasenya
		});
	}

	getUser(function(usuario) {

		if (usuario !== undefined) {
			//Se ha autenticado el usuario correctamente, vamos a guardar el Mapeo en la BBDD local
			console.log("Usuario autenticado correctamente");
			storeClasspipUser(user, username, password);

			let sendMe = classpipFile.toString().replace("//PARAMS**GO**HERE",
				`
					var params = {
						sessionID: "${sessionID}",
						user: "${user}",
						nombre: "${usuario.Nombre}",
						apellido: "${usuario.PrimerApellido}",
						identificador: "${usuario.id}",
						imagenPerfil: "${usuario.ImagenPerfil}"
					}; 
				`);



			res.setHeader("Content-Type", "text/html");
			res.send(sendMe);
		}
		else{
			let sendError = loginClasspipFile.toString().replace("//PARAMS**GO**HERE",
				`
					var params = {
						sessionID: "${sessionID}",
						user: "${user}",
						nombre: "${nombre}",
						apellido: "${apellido}"
					};
					alert("Credenciales incorrectas. ¡Por favor vuelva a introducir su usuario y contraseña!"); 
				`);

			res.setHeader("Content-Type", "text/html");
			res.send(sendError);
		}
	});
});

app.get("/grade/:sessionID/:grade", (req, res) => {
	const session = sessions[req.params.sessionID];
	let grade = req.params.grade;
	let resp;

	if (grade < 60) {
		resp = `${grade} is too low. How about sixty instead?`;
		grade = 60;
	} else if (grade > 90) {
		resp = `${grade} is too high. How about ninety instead?`;
		grade = 90;
 	} else {
 		resp = `${grade} sounds reasonable, sure.`;
 	}
	
	session.outcome_service.send_replace_result(grade/100, (err, isValid) => {
		if (!isValid)
			resp += `<br/>Update failed ${err}`;

		res.send(resp);
	});

});    // app.get("/grade...")

/**
 * Puntuar un cuestionario
 */
app.get("/quizGrade/:sessionID/:idCuestionario/:idJuegoCuestionario/:grade/:score/:numeroPreguntas", (req, res) => {
    const session = sessions[req.params.sessionID];
	let grade = req.params.grade;
	let idCuestionario = req.params.idCuestionario;
	let idJuegoCuestionario = req.params.idJuegoCuestionario;
	let score = req.params.score;
	let numeroPreguntas = req.params.numeroPreguntas;
	let incorrectas = numeroPreguntas - score;
	let resp;
	console.log("Ha llegado la nota : " + grade + " para la sesión: " + req.params.sessionID);
    resp = `Tu nota para este questionario es: ${grade}.`;

	const request = require('request');

	const options = {
		url: 'https://secret-dawn-80749.herokuapp.com/api/JuegosDeCuestionario/'+ idJuegoCuestionario,
		json: true,
		body: {
			PuntuacionCorrecta: score,
			PuntuacionIncorrecta: incorrectas,
			JuegoTerminado: true,
			cuestionarioId: idCuestionario
		}
	};

	request.patch(options, (err, res, body) => {
		if (err) {
			return console.log(err);
		}
		console.log(body);
	});


    session.outcome_service.send_replace_result(grade/100, (err, isValid) => {
        if (!isValid)
            resp += `<br/>Update failed ${err}`;

        res.send(resp);
    });

});

app.get("/test", (req, res) => {
	const https = require('https');

	https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', (resp) => {
		let data = '';
		let response;
		let dataParsed;
		// A chunk of data has been recieved.
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			console.log(JSON.parse(data).explanation);
			dataParsed = JSON.parse(data);
			response = '<br/> ' + dataParsed.explanation + '<br/>';
			res.send(response);
		});
		//response = '<br/> La lista de profesres <br/>';


	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
});


/**
 * Obtener lista Profesores
 */
app.get("/profesores/:user/:sessionID/:id/:imagen", (req, res) => {
	let sendMe = profesoresFile.toString().replace("//PARAMS**GO**HERE",
		`
					var params = {
						user: "${req.params.user}",
						identificador: "${req.params.id}",
						imagenPerfil: "${req.params.imagen}",
						sessionID: "${req.params.sessionID}"
					}; 
				`);

	res.setHeader("Content-Type", "text/html");
	res.send(sendMe);
});

/**
 * Función de autenticación
 */
app.get("/alumno/:user/:nombre/:apellido", (req, res) => {
	const https = require('https');
	console.log(req.params.user);
	console.log(req.params.nombre);
	console.log(req.params.apellido);

	let url  = "https://secret-dawn-80749.herokuapp.com/api/Alumnos?filter=%7B%22where%22%3A%7B%22Nombre%22%3A%22"+req.params.nombre +"%22%2C%22PrimerApellido%22%3A%22"+req.params.apellido+"%22%7D%7D";

	https.get(url, (resp) => {
		let data = '';
		let response;
		let dataParsed;
		// A chunk of data has been receive
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			console.log(JSON.parse(data));
			dataParsed = JSON.parse(data);
			response = '<br/> Hola ' + req.params.user + ' <br/> El alumno que se intenta autenticar tiene este id :  <br/>';
			response = response + '<br/> ' + dataParsed[0].id;

			res.send(response);
		});



	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});

});

/**
 * Obtener los grupos del usuario
 */
app.get("/cursos/:user/:sessionID/:id", (req, res) => {
	const https = require('https');


	var url  = "https://secret-dawn-80749.herokuapp.com/api/alumnos/"+ req.params.id + "/grupos";

	https.get(url, (resp) => {
		let data = '';
		let response;
		let dataParsed;
		// A chunk of data has been receive
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			console.log(JSON.parse(data));
			dataParsed = JSON.parse(data);
			response = '<br/> Hola ' + req.params.user + ' <br/> Estos son los cursos en los que está matriculado :  <br/>';
			for(let j = 0; j < dataParsed.length; j++ ){
				response = response + '<br/> Nombre del curso: ' + dataParsed[j].Descripcion ;
			}

			res.send(response);
		});



	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});

});

/**
 * Obtener los cuestionarios disponibles
 */
app.get("/cuestionarios/:user/:sessionID/:id/:imagen", (req, res) => {

	let sendMe = cuestionariosFile.toString().replace("//PARAMS**GO**HERE",
		`
					var params = {
						user: "${req.params.user}",
						identificador: "${req.params.id}",
						imagenPerfil: "${req.params.imagen}",
						sessionID: "${req.params.sessionID}"
					}; 
				`);

	res.setHeader("Content-Type", "text/html");
	res.send(sendMe);

});
/**
 * Obtener el avatar del usuario
 */
app.get("/avatar/:user/:sessionID/:id/:imagen", (req, res) => {

	const https = require('https');


	var url  = "https://secret-dawn-80749.herokuapp.com/api/alumnosJuegoAvatar?filter=%7B%22where%22%3A%7B%22alumnoId%22%3A%22" + req.params.id + "%22%7D%7D";

	https.get(url, (resp) => {
		let data = '';
		let dataParsed;
		// A chunk of data has been receive
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			console.log("********************** Data parsed ")

			dataParsed = JSON.parse(data);
			let silueta;
			let complemento1;
			let complemento2;
			let complemento3;
			let complemento4;
			if (dataParsed[0] !== undefined){
				silueta = dataParsed[0].Silueta;
				complemento1 = dataParsed[0].Complemento1;
				complemento2 = dataParsed[0].Complemento2;
				complemento3 = dataParsed[0].Complemento3;
				complemento4 = dataParsed[0].Complemento4;
			}


			console.log(dataParsed);
			let sendMe;
			sendMe = avatarFile.toString().replace("//PARAMS**GO**HERE",
				`
				var params = {
					user: "${req.params.user}",
					identificador: "${req.params.id}",
					imagenPerfil: "${req.params.imagen}",
					sessionID: "${req.params.sessionID}",
					Silueta: "${silueta}",
					Complemento1: "${complemento1}",
					Complemento2: "${complemento2}",
					Complemento3: "${complemento3}",
					Complemento4: "${complemento4}"
					
				}; 
			`);


			res.setHeader("Content-Type", "text/html");
			res.send(sendMe);

		});

	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});


});

/**
 * Obtener un cuestionario, si ya está terminado devolver nota
 */
app.get("/cuestionario/:user/:id/:imagen/:sessionID/:idCuestionario", (req, res) => {

	const https = require('https');


	var url  = "https://secret-dawn-80749.herokuapp.com/api/Cuestionarios/"+ req.params.idCuestionario + "/juegosDeCuestionario";

	https.get(url, (resp) => {
		let data = '';
		let response;
		let dataParsed;
		// A chunk of data has been receive
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			console.log(JSON.parse(data));
			dataParsed = JSON.parse(data);
			let sendMe;
			if (dataParsed[0].JuegoTerminado == false){
				let idJuegoCuestionario = dataParsed[0].id;
				sendMe = cuestionarioFile.toString().replace("//PARAMS**GO**HERE",
					`
					var params = {
						user: "${req.params.user}",
						identificador: "${req.params.id}",
						imagenPerfil: "${req.params.imagen}",
						idCuestionario:"${req.params.idCuestionario}",
 						sessionID: "${req.params.sessionID}",
 						idJuegoCuestionario:"${idJuegoCuestionario}"
					}; 
				`);

			}

			else{
				let PuntuacionCorrecta = dataParsed[0].PuntuacionCorrecta;
				let PuntuacionIncorrecta = dataParsed[0].PuntuacionIncorrecta;
				let idJuegoCuestionario = dataParsed[0].id;
				/*
				let sendMe = cuestionariosFile.toString().replace("//PARAMS**GO**HERE",
					`
					var params = {
						user: "${req.params.user}",
						identificador: "${req.params.id}",
						imagenPerfil: "${req.params.imagen}",
						sessionID: "${req.params.sessionID}"
					};
					alert("Este questionario ya ha sido completado.
						Respuestas correctas : ${PuntuacionCorrecta}\n
						Respuestas incorrectas : ${PuntuacionIncorrecta}\n")
				`);
				*/
				sendMe = gradeFile.toString().replace("//PARAMS**GO**HERE",
					`
					var params = {
						user: "${req.params.user}",
						identificador: "${req.params.id}",
						imagenPerfil: "${req.params.imagen}",
						idCuestionario:"${req.params.idCuestionario}",
						 sessionID: "${req.params.sessionID}",
						 idJuegoCuestionario:"${idJuegoCuestionario}",
						 PuntuacionCorrecta:"${PuntuacionCorrecta}",
						 PuntuacionIncorrecta:"${PuntuacionIncorrecta}"
					}; 
				`);

			}

			res.setHeader("Content-Type", "text/html");
			res.send(sendMe);

		});

	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});


});

/**
 * Obtener Lista de Alumnos
 */
app.get("/alumnos/:user/:sessionID/:id/:imagen", (req, res) => {

	let sendMe = alumnosFile.toString().replace("//PARAMS**GO**HERE",
		`
					var params = {
						user: "${req.params.user}",
						identificador: "${req.params.id}",
						imagenPerfil: "${req.params.imagen}",
						sessionID: "${req.params.sessionID}"
					}; 
				`);

	res.setHeader("Content-Type", "text/html");
	res.send(sendMe);
});

// get the app environment from Cloud Foundry
let appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
