class Widgets {
  constructor() {
    this.models = [
      { id: 1, name: "Wingnut" },
      { id: 2, name: "Monkeywrench" },
      { id: 3, name: "Brass ring" }
    ];
  }

  all() {
    return this.models;
  }
}

export default new Widgets();
