const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const BUBBLE_SIZE = 20;
const BUBBLE_SPEED = 30; // pixels per second
const MINIMUM_BUBBLE_SPEED = 10; // c'est la vitesse minimale
const SPEED_COEFFICIENT = 1.2; // C'est le facteur qui va permettre la dépendance à la taille


// Paramètres du mode Explosion
const NUMBER_OF_EXPLOSION_BUBBLES = 8;
const MINIMUM_EXPLOSION_SPEED = 50; // pour gérer le cas où un simple click sans déplacement provoque une explosiion

//const MAGNET_SPEED = 100; // vitesse d'attraction en pixels/seconde

// Constantes pour contrôler la force et limiter la vitesse d'attraction de l'aimant
const MAGNET_STRENGTH = 10000;
const MAX_MAGNET_SPEED = 300;
// gravity s'exprime en pixels/s2
const GRAVITY = 200;
const BOUNCE_FACTOR = 0.8; // pour matérialiser la perte d'énergie à chaque saut
const MINIMUM_BOUNCE_SPEED = 20;// pour pouvoir imobiliser la bulle quand la vitesse devitne trop petite

// Dimensions du trou noir
const BLACK_HOLE_RADIUS = 30;  // Rayon du trou noir
const BLACK_HOLE_RANGE = 150;  // Rayon maximal de la zone d'attraction

// Force d'attraction du trou noir
const BLACK_HOLE_STRENGTH = 250;


let lastTime_ms;
let bubbles = [];
let heldBubble = null;

let isPause =false; //c'est al vairable qui va mémoriser l'état play ou pause
                    // on l'initialise à false parce que au chargemen on veut que ce soit à play


//variables pour memoriser le point de départ du lanceur 2d
let launchOriginX = null;
let launchOriginY = null;

// variable pour suivre la postion l'extremité de la flêche
let launchCurrentX = null;
let launchCurrentY = null;

// variables pour connaîre la position de l'aimant
let magnetX = null;
let magnetY = null;
let magnetIsActive = false;

// Variables pour mémoriser le point de départ de l'explosion
let explosionOriginX = null;
let explosionOriginY = null;

// Variables pour suivre la position actuelle de la souris
let explosionCurrentX = null;
let explosionCurrentY = null;

// Position du trou noir
// null signifie qu'aucun trou noir n'a encore été placé
let blackHoleX = null;
let blackHoleY = null;

function addBubble(x, y, type,color,size) {    // une bulle a désormais unr couleur , une taille
  const bubble = { x, y, type,color,size, held: false,vy: 0,  onGround: false };   //vy c est pour la gravité et on ground permet de savoir si elle est déjà immobilisée
  bubbles.push(bubble);
  return bubble;
}


function clearBubbles() {
  bubbles = [];
}


function onMouseDown(event) {

  //si l'utilisataur utilise le mode magnet alors cette fonction ne s'exécute pas
  if (getSelectedToolMode() === "magnet") {
    return;
  }
 
 
  //je recupère la position du canvas
  const rect = canvas.getBoundingClientRect();

  //on conserve la postion de la souris dans le canvas
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY -rect.top;

  // Si l'outil Trou noir est sélectionné,
  // placer le trou noir à la position du clic
  if (getSelectedToolMode() === "blackHole") {
    blackHoleX = mouseX;
    blackHoleY = mouseY;

    // Empêcher ce clic de créer également une bulle
    return;
  }
  

  // on distingue les modes de création et normal
  if (getSelectedCreationMode()==="launcher" ){ //comportement launcher
  

    // je mémorise la position de lancement
    launchOriginX = mouseX;
    launchOriginY = mouseY;

    launchCurrentX = mouseX;
    launchCurrentY = mouseY;

  }  else if (getSelectedCreationMode() === "explosion") {

    // Mémorise le point où commence l'explosion
    explosionOriginX = mouseX;
    explosionOriginY = mouseY;

    // Au départ, la position actuelle est la même que le point initial
    explosionCurrentX = mouseX;
    explosionCurrentY = mouseY;
  } else  {

    // comportment normal
  heldBubble = addBubble(
    event.clientX - rect.left,  //===mouseX
    event.clientY - rect.top,   // ===mouseY
    selectedShape(),
    selectedBubbleColor(),
    selectedBubbleSize()
  );
  heldBubble.held = true;
  }


}


function onMouseMove(event) {
  if (!heldBubble) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  heldBubble.x = event.clientX - rect.left;
  heldBubble.y = event.clientY - rect.top;
}

function onLauncherMouseMove(event) {

  if (getSelectedCreationMode() === "launcher" && launchOriginX !== null) {
   
    const rect = canvas.getBoundingClientRect();

    launchCurrentX = event.clientX - rect.left;
    launchCurrentY = event.clientY - rect.top;
  }
}



function onMouseUp() {
  if (heldBubble) {
    heldBubble.held = false;
    heldBubble = null;
  }
}


function selectedShape() {
  return document.querySelector('input[name="shape"]:checked').value;
}
function selectedBubbleColor(){ // fonction pour renvoyer la coueur choisie
  let color;
  color =document.getElementById("bubbleColor").value;
  return color
}
function selectedBubbleSize(){  // pour renvoyer la taille de la bulle
  let size;
  size = document.getElementById("bubbleSize").value;
  return Number(size);
}
function playPause(){
                              //on inverse la valeur qui de la variable
  if (isPause=== true){
    isPause = false;
  }else {
    isPause = true;
  }

  const playPauseButton = document.getElementById("pauseAndPlayButton");
                              // on change le texte qui s'affiche
  if(isPause === true){
    playPauseButton.textContent = "Play";
  } else {
    playPauseButton.textContent = "Pause";
  }
}

//ici nous somme dans le mode création de bulles
//cette fonction permet de savoir lequel des modes est sélectionné
function getSelectedCreationMode(){
  return document.querySelector('input[name ="bubbleCreationMode"]:checked').value;
}

// losqu'on lâche souris au lancement
function onLauncherMouseUp() {

  if ( getSelectedCreationMode() === "launcher" && launchOriginX !== null) {

    const launchedBubble = addBubble(launchOriginX,launchOriginY,selectedShape(),selectedBubbleColor(),selectedBubbleSize());
    // stocket dans la bulle le vecteur lancement
    launchedBubble.dx = launchCurrentX - launchOriginX;
    launchedBubble.dy = launchCurrentY - launchOriginY;

    // Conserver la vitesse verticale initiale du lancement
    // lorsque la gravité est activée
    launchedBubble.vy = launchedBubble.dy;
        
    launchOriginX = null;
    launchOriginY = null;
    launchCurrentX = null;
    launchCurrentY = null;
  }
}
function getSelectedToolMode(){
  return document.querySelector('input[name ="toolMode"]:checked').value;
}

//lorsque le mode aimant est activé
function onMagnetMouseDown(event) {

  if (getSelectedToolMode() === "magnet") {

    const rect = canvas.getBoundingClientRect();

    magnetX = event.clientX - rect.left;
    magnetY = event.clientY - rect.top;

    magnetIsActive = true;

    console.log("MAGNET ACTIF", magnetX, magnetY);
  }
}

//losque le mode aiment est activé et le boutton de la souris est appuyé et la souris déplacée
function onMagnetMouseMove(event) {

  if (getSelectedToolMode() === "magnet") {

    const rect = canvas.getBoundingClientRect();

    magnetX = event.clientX - rect.left;
    magnetY = event.clientY - rect.top;

   // Cache le curseur normal pour le remplacer visuellement par l'aimant
    //canvas.style.cursor = "none";
  }else {

    // Remet le curseur normal lorsqu'aucun outil n'est utilisé
    //canvas.style.cursor = "default";
  }
}

// on désactive l'aimant au relâchement
function onMagnetMouseUp() {

  if (magnetIsActive === true) {
    magnetIsActive = false;

    magnetX = null;
    magnetY = null;
  }
}
// Dessinons l'outil aimant à la position du curseur
function drawMagnet() {

  if (
    getSelectedToolMode() === "magnet" && magnetX !== null && magnetY !== null ) {

    ctx.font = "30px Arial";
    ctx.fillText("\u{1F9F2}", magnetX, magnetY); //\u{1F9F2} est l'uniconde que possède l'émoji de laimant
  }
}

function handleCollisions() {

  // On parcourt toutes les bulles
  for (let i = 0; i < bubbles.length; i++) {

    // On compare la bulle i uniquement avec les bulles suivantes
    // pour éviter de comparer deux fois la même paire
    for (let j = i + 1; j < bubbles.length; j++) {

      const bubble1 = bubbles[i];
      const bubble2 = bubbles[j];

      // Écart horizontal et vertical entre les centres des deux bulles
      const dx = bubble2.x - bubble1.x;
      const dy = bubble2.y - bubble1.y;

      // Distance entre les centres des deux bulles
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Distance minimale entre les centres pour éviter le chevauchement
      // Elle correspond à la somme des rayons des deux bulles
      const minimumDistance =
        bubble1.size / 2 + bubble2.size / 2;

      // Si la distance réelle est plus petite que la distance minimale,
      // les deux bulles se chevauchent
      if (distance < minimumDistance && distance > 0) {

        // Calcul de la profondeur du chevauchement
        const overlap = minimumDistance - distance;

        // Direction allant de la bulle 1 vers la bulle 2
        const directionX = dx / distance;
        const directionY = dy / distance;

        // Chaque bulle est déplacée de la moitié du chevauchement
        const separation = overlap / 2;

        // On éloigne la bulle 1 dans le sens opposé
        bubble1.x -= directionX * separation;
        bubble1.y -= directionY * separation;

        // On éloigne la bulle 2 dans le sens de la direction
        bubble2.x += directionX * separation;
        bubble2.y += directionY * separation;
      }

    }
  }
}

// pour mettre à jour le curseur
function updateToolCursor() {

  if (getSelectedToolMode() === "magnet") {

    // Cache le curseur normal lorsque l'aimant est sélectionné
    canvas.style.cursor = "none";

  } else {

    // Rétablit le curseur normal lorsqu'aucun outil n'est sélectionné
    canvas.style.cursor = "default";
  }
}
//========================================
//EXPLOSION
//=======================================


// Suit la position de la souris pendant la préparation de l'explosion
function onExplosionMouseMove(event) {

  if (
    getSelectedCreationMode() === "explosion" &&
    explosionOriginX !== null
  ) {

    const rect = canvas.getBoundingClientRect();

    explosionCurrentX = event.clientX - rect.left;
    explosionCurrentY = event.clientY - rect.top;
  }
}
// Lorsque l'utilisateur relâche la souris, on déclenche l'explosion
function onExplosionMouseUp() {

  if (getSelectedCreationMode() === "explosion" &&explosionOriginX !== null) {

    // Distance horizontale et verticale entre le point initial
    // et la position où la souris est relâchée
    const dxExplosion = explosionCurrentX - explosionOriginX;
    const dyExplosion = explosionCurrentY - explosionOriginY;

    // Distance parcourue par la souris : elle détermine la puissance
    const explosionDistance = Math.sqrt(dxExplosion * dxExplosion +dyExplosion * dyExplosion);

    // La vitesse augmente avec la distance parcourue,
    // tout en conservant une vitesse minimale pour un simple clic
    const explosionSpeed = Math.max(MINIMUM_EXPLOSION_SPEED, explosionDistance);

    // Angle entre deux bulles successives de l'explosion
    const angleStep =(Math.PI * 2) / NUMBER_OF_EXPLOSION_BUBBLES;

    // Création des bulles dans différentes directions
    for (let i = 0; i < NUMBER_OF_EXPLOSION_BUBBLES; i++) {

      // Angle correspondant à la direction de cette bulle
      const angle = i * angleStep;
      // Taille de la bulle
      const bubbleSize = selectedBubbleSize();

      // Petite distance entre le centre de l'explosion et la bulle
      const startDistance = bubbleSize   //bubbleSize / 2;

        // Création de la 
      const explodedBubble = addBubble(
        explosionOriginX + Math.cos(angle) * startDistance,
        explosionOriginY + Math.sin(angle) * startDistance,
        selectedShape(),
        selectedBubbleColor(),
        bubbleSize
      );

      // Décomposition de la vitesse suivant X et Y
      explodedBubble.dx = Math.cos(angle) * explosionSpeed;
      explodedBubble.dy = Math.sin(angle) * explosionSpeed;
    }
    // L'explosion est terminée : on réinitialise les positions
    explosionOriginX = null;
    explosionOriginY = null;
    explosionCurrentX = null;
    explosionCurrentY = null;
  }
}

// activation de la gravité

function isGravityActive() {
  return document.getElementById("gravityCheckbox").checked;
}

//======================================
// trou noir
//======================================
// Dessiner le trou noir et sa zone d'attraction
function drawBlackHole() {

  // Ne rien dessiner si l'outil Trou noir n'est pas sélectionné
  // ou si aucun trou noir n'a encore été placé
  if (getSelectedToolMode() !== "blackHole" || blackHoleX === null ||blackHoleY === null) {
    return;
  }

  // Dessiner la zone d'attraction en gris transparent
  ctx.beginPath();
  ctx.arc(blackHoleX,blackHoleY,BLACK_HOLE_RANGE,0,Math.PI * 2);
  ctx.fillStyle = "rgba(150, 150, 150, 0.25)";
  ctx.fill();

  // Dessiner le trou noir au centre de la zone d'attraction
  ctx.beginPath();
  ctx.arc(blackHoleX,blackHoleY,BLACK_HOLE_RADIUS,0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
}

const logoutButton = document.getElementById("logoutButton");

function logout() {

    fetch("/logout", {
        method: "POST"
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {

        if (data.success) {
            window.location.href = "/";
        }

    });
}



function draw(time_ms) {
  const dt = lastTime_ms === undefined ? 0 : (time_ms - lastTime_ms) / 1000;
  lastTime_ms = time_ms;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const bubble of bubbles) {
    
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, /*BUBBLE_SIZE*/bubble.size / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = bubble.color; //"black";
    const innerSize = /*BUBBLE_SIZE*/bubble.size / 2;
    if (bubble.type === "circle") {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, innerSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bubble.type === "square") {
      ctx.fillRect(bubble.x - innerSize / 2, bubble.y - innerSize / 2, innerSize, innerSize);
    } else if(bubble.type==="triangle"){
      ctx.beginPath();
      ctx.moveTo(bubble.x,bubble.y-innerSize/2);
      ctx.lineTo(bubble.x-innerSize/2,bubble.y+innerSize/2);
      ctx.lineTo(bubble.x + innerSize/2,bubble.y + innerSize/2);
      ctx.closePath();
      ctx.fill();
    }

    if (bubble.held||isPause === true ) { // si on est en pause alors isPause c est true et on ne doit pas continuer
      continue;                           // pendant la pause le déplacement vertical n'est pas appliqué.
    }
    /*const speed = Math.max(MINIMUM_BUBBLE_SPEED,bubble.size*SPEED_COEFFICIENT);//on définit la vitesse
    bubble.y -= speed * dt//BUBBLE_SPEED * dt;   // on calcule la position
    */

   //============================================
    // MOUVEMENT DE LA BULLE
    //============================================

    // 1. L'aimant est prioritaire
    if (magnetIsActive === true) {

      const dxMagnet = magnetX - bubble.x;
      const dyMagnet = magnetY - bubble.y;

      const distance = Math.sqrt(dxMagnet * dxMagnet + dyMagnet * dyMagnet);

      if (distance > 0) {

        const directionX = dxMagnet / distance;
        const directionY = dyMagnet / distance;

        const magnetSpeed = Math.min(MAX_MAGNET_SPEED,MAGNET_STRENGTH / distance);

        bubble.x += directionX * magnetSpeed * dt;
        bubble.y += directionY * magnetSpeed * dt;
      }
    }


    // 2. Si la gravité est activée
    else if (isGravityActive() === true) {

      // Si la bulle vient du Launcher ou de l'Explosion,
      // on conserve son déplacement horizontal
      if (bubble.dx !== undefined) {
        bubble.x += bubble.dx * dt;
      }

    if (bubble.onGround === false) {

      // La gravité augmente la vitesse verticale
      bubble.vy += GRAVITY * dt;

      // La vitesse verticale modifie la position
      bubble.y += bubble.vy * dt;
    }
      // Position du sol
      const floor = canvas.height - bubble.size / 2;

      // Rebond
    if (bubble.y > floor) {

      // Replace la bulle exactement sur le sol
      bubble.y = floor;

      // La bulle perd une partie de sa vitesse au rebond
      bubble.vy = -bubble.vy * BOUNCE_FACTOR;

      // Si le rebond devient trop faible, on l'arrête
      if (Math.abs(bubble.vy) < MINIMUM_BOUNCE_SPEED) {
        bubble.vy = 0;
      }
}
    }


    // 3. Launcher ou Explosion sans gravité
    else if (bubble.dx !== undefined) {

      bubble.x += bubble.dx * dt;
      bubble.y += bubble.dy * dt;
    }


    // 4. Bulle normale sans gravité
    else {

      const speed = Math.max(MINIMUM_BUBBLE_SPEED,bubble.size * SPEED_COEFFICIENT);

      bubble.y -= speed * dt;
    }
//============================================
// ATTRACTION DU TROU NOIR
//============================================

// Vérifier qu'un trou noir a été placé
if (getSelectedToolMode() === "blackHole" && blackHoleX !== null && blackHoleY !== null) {

  // Calculer le vecteur allant de la bulle vers le trou noir
  const dxBlackHole = blackHoleX - bubble.x;
  const dyBlackHole = blackHoleY - bubble.y;

  // Calculer la distance entre la bulle et le centre du trou noir
  const distanceBlackHole = Math.sqrt(dxBlackHole * dxBlackHole +dyBlackHole * dyBlackHole);

  // Rayon de la bulle
  const bubbleRadius = bubble.size / 2;

  // Si la bulle touche le trou noir,
  // elle est marquée comme absorbée
  if (distanceBlackHole <= BLACK_HOLE_RADIUS + bubbleRadius) {
    bubble.absorbed = true;
    continue;
  }
  // L'attraction commence dès que le bord de la bulle
  // touche la zone d'attraction du trou noir
  if (
    distanceBlackHole <= BLACK_HOLE_RANGE + bubbleRadius &&
    distanceBlackHole > BLACK_HOLE_RADIUS
  ) {

    // Calculer la direction de la bulle vers le trou noir
    const directionX = dxBlackHole / distanceBlackHole;
    const directionY = dyBlackHole / distanceBlackHole;

    // Déplacer la bulle vers le centre du trou noir
    bubble.x += directionX * BLACK_HOLE_STRENGTH * dt;
    bubble.y += directionY * BLACK_HOLE_STRENGTH * dt;
  }
  }

    const ceiling = bubble.size / 2;
    

  }

  // Supprimer du tableau toutes les bulles absorbées
  bubbles = bubbles.filter(function(bubble) {
  return bubble.absorbed !== true;
  });

  handleCollisions(); // Sépare les bulles qui se chevauchent
  drawMagnet();       // Dessine l'outil aimant au-dessus des bulles

  // je dessine la flêche du lancement
if (getSelectedCreationMode() === "launcher" && launchOriginX !== null) {

  const dx = launchCurrentX - launchOriginX;
  const dy = launchCurrentY - launchOriginY;

  const angle = Math.atan2(dy, dx);
  const arrowHeadLength = 10;

  ctx.strokeStyle = "black";
  ctx.beginPath();

  // Trait principal
  ctx.moveTo(launchOriginX, launchOriginY);
  ctx.lineTo(launchCurrentX, launchCurrentY);

  // Premier côté de la pointe
  ctx.lineTo(
    launchCurrentX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
    launchCurrentY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
  );

  // Retour à l'extrémité
  ctx.moveTo(launchCurrentX, launchCurrentY);

  // Deuxième côté de la pointe
  ctx.lineTo(
    launchCurrentX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
    launchCurrentY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
  );

  ctx.stroke();
}

  // Afficher le trou noir s'il a été placé
  drawBlackHole();
  requestAnimationFrame(draw);
}

canvas.addEventListener("mousedown", onMouseDown);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", onMouseUp);
document.getElementById("clearButton").addEventListener("click", clearBubbles);

document.getElementById("pauseAndPlayButton").addEventListener("click",playPause);

// lorque la souris bouge on veut capter le déplacement du lanceur. 
window.addEventListener("mousemove",onLauncherMouseMove)
window.addEventListener("mouseup", onLauncherMouseUp);

// lorsque le mode aimant est activé
canvas.addEventListener("mousedown", onMagnetMouseDown);
window.addEventListener("mousemove", onMagnetMouseMove);
window.addEventListener("mouseup", onMagnetMouseUp);

logoutButton.addEventListener("click", logout);


// pour mettre à jour le curseur
const toolButtons = document.querySelectorAll('input[name="toolMode"]');

for (const button of toolButtons) {

  button.addEventListener("change", function() {

    // Mettre à jour le curseur selon l'outil sélectionné
    updateToolCursor();
    // Effacer l'ancienne position du trou noir
    // pour obliger l'utilisateur à cliquer à nouveau
    blackHoleX = null;
    blackHoleY = null;

    // Récupérer les boutons des modes de création
    const creationButtons =
      document.querySelectorAll('input[name="bubbleCreationMode"]');

    // Désactiver les modes de création lorsqu'un outil est utilisé
    for (const creationButton of creationButtons) {

      if (getSelectedToolMode() !== "normal") {
        creationButton.disabled = true;
      } else {
        creationButton.disabled = false;
      }
    }
  });
}


// Suit le déplacement de la souris pendant l'explosion
window.addEventListener("mousemove", onExplosionMouseMove);

// Déclenche l'explosion au relâchement
window.addEventListener("mouseup", onExplosionMouseUp);

requestAnimationFrame(draw);
