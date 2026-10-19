import walkStraight from '../data/levels/01-walk-straight.json' with { type: 'json' };

// Les niveaux : leur décor (public/assets/), leur atlas (tools/build_level.py), leur morceau.

export const DECORS = {
  rue: 'assets/decor/rue.png',      // 2140 × 342, la rue de nuit
};

export const TITLE_MUSIC = 'assets/audio/02.mp3';     // Metal Slug (feat. Guillaume - Circles)

export const LEVELS = [
  {
    def: walkStraight,
    atlas: 'assets/levels/01-walk-straight/niveau',   // .png, .json, .atlas.json
    music: 'assets/audio/01.mp3',
  },
];

// La rue de la démo : la rue jusqu'avant la vue sur la ville, puis la rue entière (la vue sur
// la ville sert de fin). Les deux façades de brique se raccordent en x = 1813.
export const STREET = {
  decor: { image: 'rue', segments: [[0, 1813], [0, 2140]] },
};
