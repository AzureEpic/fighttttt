// game.js
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.2); // Dark blue sky

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);

    return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});


// Add this inside your createScene function

// Player
const player = BABYLON.MeshBuilder.CreateSphere("player", {diameter: 1}, scene);
player.position = new BABYLON.Vector3(-5, 0.5, 0);
const playerMaterial = new BABYLON.StandardMaterial("playerMat", scene);
playerMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green
player.material = playerMaterial;

// NPC
const npc = BABYLON.MeshBuilder.CreateBox("npc", {size: 1}, scene);
npc.position = new BABYLON.Vector3(5, 0.5, 0);
const npcMaterial = new BABYLON.StandardMaterial("npcMat", scene);
npcMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
npc.material = npcMaterial;






// --- AI and Combat Logic ---

let npcState = "IDLE";
const SIGHT_DISTANCE = 10;
const ATTACK_RANGE = 1.5;

// NPC health and stats
let npcHealth = 100;

// This function will contain all our AI logic
function runNpcAI() {
    const distanceToPlayer = BABYLON.Vector3.Distance(npc.position, player.position);

    // State Transitions
    switch (npcState) {
        case "IDLE":
            if (distanceToPlayer < SIGHT_DISTANCE) {
                changeNpcState("CHASING");
            }
            break;

        case "CHASING":
            if (distanceToPlayer <= ATTACK_RANGE) {
                changeNpcState("ATTACKING");
            } else if (distanceToPlayer > SIGHT_DISTANCE) {
                changeNpcState("IDLE");
            }
            break;

        case "ATTACKING":
            if (distanceToPlayer > ATTACK_RANGE) {
                changeNpcState("CHASING");
            }
            // Add a cooldown to attacks later
            break;
    }

    // State Actions
    const speed = 0.05;
    switch (npcState) {
        case "CHASING":
            // Move towards the player
            const direction = player.position.subtract(npc.position).normalize();
            npc.position.addInPlace(direction.scale(speed));
            npc.lookAt(player.position); // Make the NPC face the player
            break;

        case "ATTACKING":
            // For now, just stop moving
            // In a real game, you'd trigger an attack animation
            break;
    }
}

// Update the AI on every frame
scene.onBeforeRenderObservable.add(() => {
    runNpcAI();
});



const npcComments = {
    onStateChange: {
        IDLE: ["Guess it was nothing...", "Where did they go?", "I'll just wait here."],
        CHASING: ["I see you!", "You can't hide!", "Get over here!"],
        ATTACKING: ["Prepare to fight!", "This ends now!", "Taste my steel!"]
    },
    onTakeDamage: ["Ouch!", "A lucky hit!", "You'll pay for that!"],
    onPlayerMiss: ["Too slow!", "Is that all you've got?", "You missed!"]
};


function displayNpcComment(comment) {
    console.log(`NPC says: "${comment}"`);
    // In a real game, you would update a UI element here.
}

function getRandomComment(commentArray) {
    const index = Math.floor(Math.random() * commentArray.length);
    return commentArray[index];
}


function changeNpcState(newState) {
    if (npcState === newState) return; // Don't re-trigger if state is the same

    console.log(`NPC state changed from ${npcState} to ${newState}`);
    npcState = newState;

    const comments = npcComments.onStateChange[newState];
    if (comments) {
        displayNpcComment(getRandomComment(comments));
    }
}

// Add this inside createScene() after creating player
const inputMap = {};
scene.actionManager = new BABYLON.ActionManager(scene);

scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (evt) => { inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown"; }
    )
);
scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        (evt) => { inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown"; }
    )
);

scene.onBeforeRenderObservable.add(() => {
    const speed = 0.1;
    if (inputMap["w"]) player.position.z += speed;
    if (inputMap["s"]) player.position.z -= speed;
    if (inputMap["a"]) player.position.x -= speed;
    if (inputMap["d"]) player.position.x += speed;
});

