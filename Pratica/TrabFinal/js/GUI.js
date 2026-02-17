
function setupSliders (gl, shaders) {
  // Função auxiliar para criar a estrutura completa do slider
  function createSlider({ min, max, step, value, id, label }) {
    const wrapper = document.createElement("div");
    wrapper.className = "control-group";

    // Header do slider (Nome + Valor numérico)
    const labelContainer = document.createElement("div");
    labelContainer.className = "label-container";

    const labelText = document.createElement("span");
    labelText.className = "label-text";
    labelText.textContent = label;

    const valueDisplay = document.createElement("span");
    valueDisplay.className = "value-display";
    valueDisplay.id = `val-${id}`;
    valueDisplay.textContent = value;

    labelContainer.appendChild(labelText);
    labelContainer.appendChild(valueDisplay);

    // O input range em si
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.dataset.id = id;

    // Atualiza o texto do valor enquanto arrasta
    slider.addEventListener("input", (e) => {
      valueDisplay.textContent = e.target.value;
    });

    wrapper.appendChild(labelContainer);
    wrapper.appendChild(slider);
    return wrapper;
  }

  function createUpdateButton() {
    const b = document.createElement("button");
    b.textContent = "GERAR NOVO PLANETA";
    b.dataset.action = "update";
    return b;
  }

  function createCheckbox({ value, id, label }) {
    const wrapper = document.createElement("div");
    wrapper.className = "control-group checkbox-group";

    const labelEl = document.createElement("label");
    labelEl.className = "label-container checkbox-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = value;
    checkbox.dataset.id = id;

    const labelText = document.createElement("span");
    labelText.className = "label-text";
    labelText.textContent = label;

    // Montagem: [Checkbox] [Texto]
    labelEl.appendChild(checkbox);
    labelEl.appendChild(labelText);
    wrapper.appendChild(labelEl);
    
    return wrapper;
  }

  const container = document.getElementById("controls");
  container.innerHTML = ""; // Limpa se necessário

  // Adicionando os controles com nomes legíveis
  container.appendChild(createSlider({ min: 0, max: 500, step: 1, value: planetParams.numTrees, id: "numTrees", label: "Qtd. Árvores" }));
  container.appendChild(createSlider({ min: 0, max: 3, step: 0.2, value: planetParams.treeSize, id: "treeSize", label: "Tamanho Árvores" }));
  container.appendChild(createSlider({ min: 0.5, max: 10, step: 0.1, value: planetParams.radius, id: "radius", label: "Raio" }));
  container.appendChild(createSlider({ min: 1, max: 7, step: 1, value: planetParams.subdivisions, id: "subdivisions", label: "Detalhes" }));
  container.appendChild(createSlider({ min: 0.00, max: 6, step: 0.05, value: planetParams.roughness, id: "roughness", label: "Rugosidade" }));
  
  container.append(createCheckbox({value: planetParams.moveSun, id:"moveSun", label:"Mover o Sol"}));

  container.appendChild(createUpdateButton());


  // Event Listeners
  container.addEventListener("input", (event) => {
    if (event.target.type === "range") {
      planetParams[event.target.dataset.id] = Number(event.target.value);
    } else if (event.target.type === "checkbox") {
    planetParams[event.target.dataset.id] = event.target.checked;
    }
  });

  container.addEventListener("click", (event) => {
    if (event.target.dataset.action === "update") {
      planetParams.seed = Math.random() * 10000;
      // Certifique-se que initializePlanet e shaders estejam acessíveis
      shaders.planet = initializePlanet(gl, shaders.planet.programInfo);
    }
  });

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