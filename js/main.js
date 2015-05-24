//$("#juegosDisponibles > option").length

var nivel ;
var token = "e9120a0f212d2e1ed8ea56500739f1a46ae5f080";
var GameJson;
var map;
var popup = L.popup();
var sitio;
var puntos = 0;
var fotosVistas = 1;
var intervaloTiempo;
var juegoEnCurso;
var timeout;
var sitioPopup;
var clickPopup;
var juegosLista=[];
var indexJuegoSeleccionado=-1;
var indexJuegoAnterior;
var historyIndexJump;


//Event listener para el Select
$( "#juegosDisponibles" ).change(function() {
	indexJuegoSeleccionado=$("#juegosDisponibles option:selected").index();
	historyIndexJump=indexJuegoSeleccionado-indexJuegoAnterior;
	console.log(historyIndexJump);
});


//funciones para manejar la lista de juegos
function popElemento(index){
	juegosLista.splice(index,1);
}

function pushElemento(index,data){
	juegosLista.splice(index,0,data);
}

//pintar o refrescar lista de juegos disponibles
function juegosDisponibles(){
	$("#juegosDisponibles").html("");
	for (i in juegosLista){
		$("<option>"+juegosLista[i]+"</option>").appendTo("#juegosDisponibles");
	}
	$("#juegosDisponibles option[value="+indexJuegoSeleccionado+"]").attr("selected",true);

}

// Canvas para puntuación timer e imágenes

var c = document.getElementById("imgCanvas");
var ctx = c.getContext("2d");

function pararJuegoEnCurso(){
		clearTimeout(timeout);
		clearInterval(intervaloTiempo);
		fotosVistas=1;
		map.closePopup(sitioPopup);
 		map.closePopup(clickPopup);
 		map.off('click', onMapClick);
 		ctx.clearRect(0,0,500,500);
 		$("#puntuacion").html(0);
 		juegoEnCurso=false;
}

//Funcion que carga un juego ya jugado
function cargarJuego (event){
	game=event.state;

	$(".juegos").hide(1000);
	$("#marcador").show(1000);
	$("#puntuacion").html(game.puntuacion);
	
	//add listener on map
	map.on('click', onMapClick);
	comenzarJuego(game);
}

//comenzar un juego
function nuevoJuego(){
	if(!juegoEnCurso){
		juegoEnCurso=true;
		$(".dificultad").hide(1000);
		$("#marcador").show(1000);
		$("#puntuacion").html(0);
		game={name:$("#game").val(),nivel:$("#nivel").val(),puntuacion:0};
		//introducimos nueva referencia en el history
		d = new Date();
		hora = d.getHours();
		minuto = d.getMinutes();
		segundo = d.getSeconds();
		if (hora < 10) {hora = "0" + hora}
		if (minuto < 10) {minuto = "0" + minuto}
		if (segundo < 10) {segundo = "0" + segundo}

		history.pushState(game,null,"?Juego="+game.name);
		indexJuegoSeleccionado++;
		pushElemento(indexJuegoSeleccionado,game.name+" "+hora+":"+minuto+":"+segundo+" puntos: "+game.puntuacion);
		juegosDisponibles();

		//add listener on map
		map.on('click', onMapClick);

		comenzarJuego(game);
	}else{
		pararJuegoEnCurso();
		nuevoJuego();
	}
}

//continuar un juego
function continuarJuego(){
	if(!juegoEnCurso){
		
		history.go(historyIndexJump);	
	}else{
		pararJuegoEnCurso();
		continuarJuego();
	}
}



function getGameJson (game){
	if (game=="capitales"){

		github = new Github ({
		token: token,
		auth: "oauth"
		});
	}
}

function comenzarJuego(game){

	switch(game.name) {
		case "Capitales":
			map.setView([58, 30], 3);
			break;
		case "Monumentos":
			map.setView([39.317, -4.493], 5);
			break;
		case "Playas":
			map.setView([39.317, -4.493], 4);
			break;
	}

	indexJuegoAnterior = indexJuegoSeleccionado;
	nivel = game.nivel;

	puntuacion=game.puntuacion;

	//Elegimos al azar un nuevo punto geográfico
	github = new Github ({
		token: token,
		auth: "oauth"
		});
	repo = github.getRepo("djprano","X-Nav-Practica-Adivina");
    repo.read('master', 'juegos/'+game.name+'.json', function(err, data) {
	    GameJson = $.parseJSON(data);
	   	

		nrand = Math.floor((Math.random() * GameJson.features.length)); 
		var lat = GameJson.features[nrand].geometry.coordinates[1];
		var lon = GameJson.features[nrand].geometry.coordinates[0];
		var name = GameJson.features[nrand].properties.name;
		sitio={name:name,lat:lat,lon:lon};
		console.log(name+" lat:"+lat+" lon:"+lon);////////////////////////////////////quitar esto que solo era para depurar//////////////////////////////



	    //Cargamos el Json de flickr

	    var flickerAPI = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";
	    $.getJSON( flickerAPI, {
	        tags: name,
	        tagmode: "any",
	        format: "json"
	    }).done(function(data){
	        var i;
	        var src = data.items[0].media.m;

	         //Cargamos fotos de flickr del punto geográfico

			var img = new Image;
			img.onload = function(){
	  			ctx.drawImage(img,0,0); // Or at whatever offset you like
			};
			i=0;
			t=5;
			t1=t;

			//limpiamos la parte del canvas a pintar antes de poner la primera imagen
			ctx.clearRect(0,0,300,300);
			img.src = data.items[i++].media.m;

			//timer para mostrar el tiempo que queda y para la siguiente foto
			intervaloTiempo = setInterval(function(){
				if(t1==0){
					ctx.clearRect(0,0,300,300);
					img.src = data.items[i++].media.m;
					fotosVistas++;
					t1=t;

					if(i==data.items.length){//volvemos a repetir las imágenes;
						i=0;
					}
				}			
				ctx.font = "80px Arial";
				ctx.clearRect(300,0,200,200);
				ctx.fillText(--t1,300,100);
			},1000/nivel);

	    });

});
}


// se ejecuta cuando clickamos el mapa

function onMapClick(e) {

	//desactivamos el listener del mapa hasta que comience el juego de nuevo
	 map.off('click', onMapClick);

	//paramos el timer
	clearInterval(intervaloTiempo);
	
	//calculamos la puntuación y la actualizamos
	distancia = e.latlng.distanceTo(L.latLng(sitio.lat,sitio.lon))/1000;

	// popup donde clickamos
	clickPopup = L.popup();
	clickPopup.setLatLng(e.latlng)
	.setContent("Sitio a "+Math.round(distancia.toString())+" km");
	map.addLayer(clickPopup);

	puntos = Math.round(100000/(distancia*fotosVistas));
 	puntuacion = puntuacion + puntos;
 	game.puntuacion = puntuacion;
 	$("#puntuacion").html(puntuacion);
 	
 	//Pintamos en el mapa el punto para comprobar
	sitioPopup = L.popup().
	setLatLng([sitio.lat,sitio.lon]).
	setContent("La adivinanza era: "+ sitio.name);
	map.addLayer(sitioPopup);

	//actualizamos el history y la lista de juegos empezados
	d = new Date();
	hora = d.getHours();
	minuto = d.getMinutes();
	segundo = d.getSeconds();

	if (hora < 10) {hora = "0" + hora}
	if (minuto < 10) {minuto = "0" + minuto}
	if (segundo < 10) {segundo = "0" + segundo}
	history.replaceState(game,null,"?Juego="+game.name);
	//refrescamos la lista del html
	popElemento(indexJuegoSeleccionado);
	pushElemento(indexJuegoSeleccionado,game.name+" "+hora+":"+minuto+":"+segundo+" puntos: "+game.puntuacion);
	juegosDisponibles();

 	//timer para la siguiente adivinanza
 	i=0;
	t1=10;
	ctx.clearRect(0,0,400,400);
	ctx.font = "20px Arial";
	ctx.fillText("Distancia: "+Math.round(distancia)+" kms",0,40);
	//ctx.fillText("Respuesta: "+sitio.name,0,70);
	ctx.fillText("Nueva adivinanza",0,130);
	ctx.font = "30px Arial";
	ctx.fillText("Comenzará en...",0,160);
	ctx.fillText("Puntuación: "+puntos,0,100);

	//pintamos la cuenta atrás para nueva adivinanza en el canvas
 	intervaloTiempo = setInterval(function(){
		if(t1==0){
			clearInterval(intervaloTiempo);
		}			
		ctx.font = "40px Arial";
		ctx.clearRect(250,100,200,200);
		ctx.fillText(t1--,255,160);
	},1000);

 	//Lanzamos el juego despues de 10 segundos
 	timeout=setTimeout(function(){
 		map.closePopup(sitioPopup);
 		map.closePopup(clickPopup);
 		map.removeLayer(clickPopup);
 		map.removeLayer(sitioPopup);
 		fotosVistas=1;
 		//volvemos a activar el listener del mapa de nuevo
 		map.on('click', onMapClick);
 		comenzarJuego(game);
 	},11000);
}


$(document).ready(function(){

	//seteamos la función que carga un juego ya jugado en el history
	window.onpopstate = cargarJuego;


	// add an OpenStreetMap tile layer
	map = L.map('map').setView([40.283677, -3.821508], 1);

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	//listener desplega panel juego nuevo
	$( "#new" ).click(function() {
		$(".dificultad").toggle(1000);
		if($(".juegos").hide()==false){
			$(".juegos").toggle(1000);
		}
	});

	//listener juego nuevo
	$("#comenzarNuevoJuego").click(nuevoJuego);

	//listener continuar un juego seleccionado
	$("#comenzarDisponible").click(continuarJuego);

	//listener iniciar un juego ya jugado
	$( "#init" ).click(function() {
		$(".juegos").toggle(1000);
		if($(".dificultad").hide()==false){
			$(".dificultad").toggle(1000);
		}
	});

	//listener abortar un juego
	$("#abort").click(function(){
		pararJuegoEnCurso();
	});
});
