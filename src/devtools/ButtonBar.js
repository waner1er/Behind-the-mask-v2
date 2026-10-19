// Les boutons des pages d'outils. Chaque bouton sait s'il est allumé (isOn) ; après chaque
// clic, tous se remettent à jour, et refresh() le fait à la demande (après une touche).
export class ButtonBar {
  #buttons = [];

  add(groupId, label, onClick, isOn = () => false) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', () => { onClick(); this.refresh(); });
    document.getElementById(groupId).appendChild(b);
    this.#buttons.push({ b, isOn });
  }

  refresh() {
    this.#buttons.forEach(({ b, isOn }) => b.classList.toggle('on', !!isOn()));
  }
}
