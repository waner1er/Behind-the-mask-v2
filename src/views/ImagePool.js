// Des Images réutilisées d'une image à l'autre : à chaque rendu, begin(), une image par
// élément à afficher (take), puis end() cache celles qui restent. On ne crée ni ne détruit
// d'objet en cours de jeu, et l'ordre d'affichage suit l'ordre des take().
export class ImagePool {
  #items = [];
  #used = 0;

  constructor(scene, depth, texture) {
    this.scene = scene;
    this.depth = depth;
    this.texture = texture;
  }

  begin() { this.#used = 0; }

  // une image remise à zéro, sur la frame demandée (son origine suit l'ancrage de la frame)
  take(frame) {
    let img = this.#items[this.#used];
    if (img) img.setFrame(frame);
    else this.#items.push(img = this.scene.add.image(0, 0, this.texture, frame).setDepth(this.depth));
    this.#used++;
    return img.setVisible(true).setAlpha(1).setRotation(0).setScale(1).setFlipX(false).setCrop().clearTint();
  }

  end() {
    for (let i = this.#used; i < this.#items.length; i++) this.#items[i].setVisible(false);
  }
}
