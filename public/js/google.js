const socket = io();

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const socket_id = urlParams.get("id") ?? false;

if (!socket_id) window.close();

function handleCredentialResponse(response) {
  // GOOGLE - TOKEN

  const body = { id_token: response.credential, socket_id };

  fetch("https://4c5svf64-4040.brs.devtunnels.ms/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((resp) => resp.json())
    .then((resp) => {
      if (resp.msg === "¡Exito!") {
        window.close();
      }
    })
    .catch(console.warn);
}
