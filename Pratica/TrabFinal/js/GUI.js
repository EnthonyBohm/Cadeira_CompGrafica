
function setupSliders (gl, shaders) {
  function createSlider({min, max, step, value, id}){
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min  = min;
    slider.max  = max;
    slider.step = step;
    slider.value = value;
    slider.dataset.id = id;
    return slider;
  }
  function createUpdateButton () {
    const b = document.createElement("button");
    b.textContent = "Update";
    b.dataset.action = "update";
    return b;
  }

  const container = document.getElementById("controls");

  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"maxArvores"})
  );
  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"maxPedras"})
  );
  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"tamArvores"})
  );
  container.appendChild (
    createSlider({min:0, max:300, step:1, value:20, id:"tamPedras"})
  );
  container.appendChild (
    createSlider({min:0.5, max:10, step:0.5, value:planetParams.radius, id:"radius"})
  );
  container.appendChild (
    createSlider({min:1, max:7, step:1, value:planetParams.subdivisions, id:"subdivisions"})
  );
  container.appendChild (
    createSlider({min:0.00, max:4, step:0.05, value:planetParams.roughness, id:"roughness"})
  );
  container.appendChild (
    createUpdateButton()
  );
  

  container.addEventListener("input", (event) => {
    if (event.target.type = "range"){
      planetParams[event.target.dataset.id] = Number(event.target.value);
    }
  })
  container.addEventListener("click", (event) => {
    if (event.target.dataset.action === "update"){
      console.log("Atualizando planeta com:", planetParams);
      planetParams.seed = Math.random() * 10000;
      shaders.planet = initializePlanet(gl, shaders.planet.programInfo);
    }
  })

  return container;
}

function addMouseInteraction (canvas, rotation) {
var isDragging = false;
  var lastMouseX = 0;
  var lastMouseY = 0;

  const sensibility = 0.0025;

   canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;   
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  })
  
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging == false) return          

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    

    rotation[1] += deltaX * sensibility;
    rotation[0] += deltaY * sensibility;

    const limit = Math.PI / 2 - 0.01;
    if (rotation[0] > limit) rotation[0] = limit;
    if (rotation[0] < -limit) rotation[0] = -limit;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  })
}