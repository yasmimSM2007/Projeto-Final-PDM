import './style.css';

var constraints = { video: { facingMode: "user" }, audio: false };

let track = null;

const cameraView = document.querySelector("#camera--view"),
  cameraOutput = document.querySelector("#camera--output"),
  cameraSensor = document.querySelector("#camera--sensor"),
  cameraTrigger = document.querySelector("#camera--trigger");

let lastPhotoDataUrl = null;


function cameraStart() {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      track = stream.getTracks()[0];   
      cameraView.srcObject = stream;
    })
    .catch(function (error) {
      console.error("Oops. Something is broken.", error);
    });
}

cameraTrigger.onclick = function () {
  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);

  const dataUrl = cameraSensor.toDataURL("image/webp");
  cameraOutput.src = dataUrl;
  cameraOutput.classList.add("taken");
  lastPhotoDataUrl = dataUrl;


  // guarda a foto para o cardápio
  lastPhotoDataUrl = dataUrl;
};

// Start the video stream when the window loads
window.addEventListener("load", cameraStart, false);

/* ====== INDEXEDDB (armazenar prato + imagem) ====== */

let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cardapio-db", 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("dishes")) {
        const store = db.createObjectStore("dishes", { keyPath: "id" });
        store.createIndex("by-name", "name", { unique: false });
      }
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      resolve();
    };

    request.onerror = function (event) {
      console.error("Erro ao abrir IndexedDB", event.target.error);
      reject(event.target.error);
    };
  });
}

function addDish(dish) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("dishes", "readwrite");
    const store = tx.objectStore("dishes");
    const req = store.add(dish);

    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllDishes() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("dishes", "readonly");
    const store = tx.objectStore("dishes");
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function removeDish(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("dishes", "readwrite");
    const store = tx.objectStore("dishes");
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

// ----- elementos do cardápio -----
const form = document.getElementById("dish-form");
const dishesList = document.getElementById("dishes-list");

// abrir DB e listar assim que o script carregar
openDatabase()
  .then(() => {
    console.log("DB aberto na inicialização");
    return renderList();
  })
  .catch((err) => {
    console.error("Erro ao abrir DB na inicialização", err);
  });



// salvar prato
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!name || !price) {
    alert("Preencha nome e preço.");
    return;
  }

  if (!lastPhotoDataUrl) {
    const continuar = confirm(
      "Você ainda não tirou uma foto. Deseja salvar o prato mesmo assim?"
    );
    if (!continuar) return;
  }

  const dish = {
    id: Date.now(),
    name,
    price,
    description,
    photo: lastPhotoDataUrl || ""
  };

  await addDish(dish);

  form.reset();
  lastPhotoDataUrl = null;
  cameraOutput.classList.remove("taken");
  cameraOutput.src = "//:0";

  await renderList();
});

// listar pratos
async function renderList() {
  const dishes = await getAllDishes();
  dishesList.innerHTML = "";

  if (!dishes || dishes.length === 0) {
    dishesList.innerHTML = "<p>Não há pratos cadastrados.</p>";
    return;
  }

  // mais recentes primeiro
  dishes.sort((a, b) => b.id - a.id);

  dishes.forEach((dish) => {
    const div = document.createElement("div");
    div.className = "dish";

    div.innerHTML = `
      ${dish.photo ? `<img src="${dish.photo}" alt="${dish.name}">` : ""}
      <div class="info">
        <h3>${dish.name} - R$ ${dish.price}</h3>
        <p>${dish.description || ""}</p>
        <button data-id="${dish.id}">Remover</button>
      </div>
    `;

    dishesList.appendChild(div);
  });

  // eventos de remover
  dishesList.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-id"));
      await removeDish(id);
      await renderList();
    });
  });
}

/* ====== REGISTRO DO SERVICE WORKER ====== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => console.log("Service Worker registrado", reg))
    .catch((err) => console.error("Erro ao registrar SW", err));
}
