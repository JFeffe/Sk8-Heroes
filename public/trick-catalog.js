// Generated from the approved catalog. Rebuild with scripts/artwork/build-trick-catalog.mjs.
export const TRICKS=[
  {
    "id": 0,
    "key": "ollie",
    "name": "Ollie",
    "type": "kick",
    "tier": "base",
    "copies": 3,
    "points": 2,
    "difficultyPoints": 2,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9993355624142661,
    "requirementCode": "high2",
    "cost": 2,
    "pattern": "at-least",
    "threshold": 2,
    "symbols": [
      "≥2",
      "≥2"
    ],
    "rule": "Deux dés ≥ 2",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/ollie/01-illustration.webp?v=58cab4ab4fe3",
      "graphics": "assets/tricks/frames/base-2-plain.svg?v=f8435afda254",
      "information": "assets/tricks/ollie/03-textes-symboles.webp?v=5d997594676a"
    }
  },
  {
    "id": 1,
    "key": "nollie",
    "name": "Nollie",
    "type": "kick",
    "tier": "base",
    "copies": 3,
    "points": 2,
    "difficultyPoints": 2,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9845679012345679,
    "requirementCode": "double",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        1
      ],
      [
        2,
        2
      ],
      [
        3,
        3
      ],
      [
        4,
        4
      ],
      [
        5,
        5
      ],
      [
        6,
        6
      ]
    ],
    "symbols": [
      "x",
      "x"
    ],
    "rule": "Deux dés identiques",
    "comboBonus": {
      "kind": "reward",
      "type": "adjust"
    },
    "layers": {
      "illustration": "assets/tricks/nollie/01-illustration.webp?v=15f62ba28905",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/nollie/03-textes-symboles.webp?v=a957484ad02f"
    }
  },
  {
    "id": 2,
    "key": "pop-shuvit",
    "name": "Pop Shuvit",
    "type": "kick",
    "tier": "base",
    "copies": 2,
    "points": 2,
    "difficultyPoints": 2,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.96875,
    "requirementCode": "mixed",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        2
      ],
      [
        1,
        4
      ],
      [
        1,
        6
      ],
      [
        2,
        3
      ],
      [
        2,
        5
      ],
      [
        3,
        4
      ],
      [
        3,
        6
      ],
      [
        4,
        5
      ],
      [
        5,
        6
      ]
    ],
    "symbols": [
      "P",
      "I"
    ],
    "rule": "Un pair et un impair",
    "comboBonus": {
      "kind": "companion",
      "type": "kick",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/pop-shuvit/01-illustration.webp?v=81bd27a3b9e9",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/pop-shuvit/03-textes-symboles.webp?v=1e53740b412b"
    }
  },
  {
    "id": 3,
    "key": "frontside-180",
    "name": "Frontside 180",
    "type": "kick",
    "tier": "base",
    "copies": 2,
    "points": 3,
    "difficultyPoints": 3,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9545181755829903,
    "requirementCode": "oddGap",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        3
      ],
      [
        1,
        4
      ],
      [
        1,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        5
      ],
      [
        3,
        5
      ],
      [
        3,
        6
      ]
    ],
    "symbols": [
      "A",
      "B"
    ],
    "rule": "Écart ≥ 2 · au moins un impair",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/frontside-180/01-illustration.webp?v=2730b3989318",
      "graphics": "assets/tricks/frames/base-2-plain.svg?v=f8435afda254",
      "information": "assets/tricks/frontside-180/03-textes-symboles.webp?v=3482e4cda643"
    }
  },
  {
    "id": 4,
    "key": "heelflip",
    "name": "Heelflip",
    "type": "kick",
    "tier": "base",
    "copies": 2,
    "points": 3,
    "difficultyPoints": 3,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9402863511659808,
    "requirementCode": "straight2",
    "cost": 2,
    "pattern": "straight",
    "symbols": [
      "x",
      "x+1"
    ],
    "rule": "Deux valeurs consécutives",
    "comboBonus": {
      "kind": "reward",
      "type": "freeze"
    },
    "layers": {
      "illustration": "assets/tricks/heelflip/01-illustration.webp?v=41f1f0679757",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/heelflip/03-textes-symboles.webp?v=09456c276f9c"
    }
  },
  {
    "id": 5,
    "key": "kickflip",
    "name": "Kickflip",
    "type": "kick",
    "tier": "base",
    "copies": 2,
    "points": 4,
    "difficultyPoints": 4,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.890625,
    "requirementCode": "high4",
    "cost": 2,
    "pattern": "at-least",
    "threshold": 4,
    "symbols": [
      "≥4",
      "≥4"
    ],
    "rule": "Deux dés ≥ 4",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/kickflip/01-illustration.webp?v=2e093ff87df0",
      "graphics": "assets/tricks/frames/base-2-plain.svg?v=f8435afda254",
      "information": "assets/tricks/kickflip/03-textes-symboles.webp?v=3481ecdf842b"
    }
  },
  {
    "id": 6,
    "key": "varial-kickflip",
    "name": "Varial Kickflip",
    "type": "kick",
    "tier": "advanced",
    "copies": 2,
    "points": 5,
    "difficultyPoints": 5,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.8257887517146777,
    "requirementCode": "extremes",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        5
      ],
      [
        2,
        6
      ]
    ],
    "symbols": [
      "≤2",
      "≥5"
    ],
    "rule": "Un dé ≤ 2 et un dé ≥ 5",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/varial-kickflip/01-illustration.webp?v=1f5ca0720969",
      "graphics": "assets/tricks/frames/advanced-2-plain.svg?v=453f304469b0",
      "information": "assets/tricks/varial-kickflip/03-textes-symboles.webp?v=ccfba2e8f001"
    }
  },
  {
    "id": 7,
    "key": "frontside-flip",
    "name": "Frontside Flip",
    "type": "kick",
    "tier": "advanced",
    "copies": 2,
    "points": 5,
    "difficultyPoints": 5,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.7678755144032922,
    "requirementCode": "oddDistinct",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        3
      ],
      [
        1,
        5
      ],
      [
        3,
        5
      ]
    ],
    "symbols": [
      "I",
      "≠I"
    ],
    "rule": "Deux impairs différents",
    "comboBonus": {
      "kind": "companion",
      "type": "slide",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/frontside-flip/01-illustration.webp?v=bc62e272808e",
      "graphics": "assets/tricks/frames/advanced-2-bonus.svg?v=444d14e6c4b2",
      "information": "assets/tricks/frontside-flip/03-textes-symboles.webp?v=49cb2571967d"
    }
  },
  {
    "id": 8,
    "key": "backside-flip",
    "name": "Backside Flip",
    "type": "kick",
    "tier": "advanced",
    "copies": 2,
    "points": 8,
    "difficultyPoints": 6,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.7407407407407407,
    "requirementCode": "bands3",
    "cost": 3,
    "pattern": "choices",
    "choices": [
      [
        1,
        3,
        5
      ],
      [
        1,
        3,
        6
      ],
      [
        1,
        4,
        5
      ],
      [
        1,
        4,
        6
      ],
      [
        2,
        3,
        5
      ],
      [
        2,
        3,
        6
      ],
      [
        2,
        4,
        5
      ],
      [
        2,
        4,
        6
      ]
    ],
    "symbols": [
      "1–2",
      "3–4",
      "5–6"
    ],
    "rule": "Un dé de chaque tranche",
    "comboBonus": {
      "kind": "reward",
      "type": "adjust"
    },
    "layers": {
      "illustration": "assets/tricks/backside-flip/01-illustration.webp?v=a288b7be06af",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/backside-flip/03-textes-symboles.webp?v=c2a14c820d5f"
    }
  },
  {
    "id": 9,
    "key": "varial-heelflip",
    "name": "Varial Heelflip",
    "type": "kick",
    "tier": "advanced",
    "copies": 2,
    "points": 8,
    "difficultyPoints": 6,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.65625,
    "requirementCode": "even3",
    "cost": 3,
    "pattern": "choices",
    "choices": [
      [
        2,
        2,
        2
      ],
      [
        2,
        2,
        4
      ],
      [
        2,
        2,
        6
      ],
      [
        2,
        4,
        4
      ],
      [
        2,
        4,
        6
      ],
      [
        2,
        6,
        6
      ],
      [
        4,
        4,
        4
      ],
      [
        4,
        4,
        6
      ],
      [
        4,
        6,
        6
      ],
      [
        6,
        6,
        6
      ]
    ],
    "symbols": [
      "2·4·6",
      "2·4·6",
      "2·4·6"
    ],
    "rule": "Trois pairs · doublons permis",
    "comboBonus": {
      "kind": "companion",
      "type": "kick",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/varial-heelflip/01-illustration.webp?v=c949cdcd3e27",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/varial-heelflip/03-textes-symboles.webp?v=2e3829279ea1"
    }
  },
  {
    "id": 10,
    "key": "bigspin",
    "name": "Bigspin",
    "type": "kick",
    "tier": "advanced",
    "copies": 2,
    "points": 7,
    "difficultyPoints": 7,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.6488340192043895,
    "requirementCode": "high5",
    "cost": 2,
    "pattern": "at-least",
    "threshold": 5,
    "symbols": [
      "≥5",
      "≥5"
    ],
    "rule": "Deux dés ≥ 5",
    "comboBonus": {
      "kind": "reward",
      "type": "reroll"
    },
    "layers": {
      "illustration": "assets/tricks/bigspin/01-illustration.webp?v=f70bb80ab7da",
      "graphics": "assets/tricks/frames/advanced-2-bonus.svg?v=444d14e6c4b2",
      "information": "assets/tricks/bigspin/03-textes-symboles.webp?v=bd983fd03938"
    }
  },
  {
    "id": 11,
    "key": "inward-heelflip",
    "name": "Inward Heelflip",
    "type": "kick",
    "tier": "advanced",
    "copies": 2,
    "points": 9,
    "difficultyPoints": 7,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.5941358024691358,
    "requirementCode": "straight3",
    "cost": 3,
    "pattern": "straight",
    "symbols": [
      "x",
      "x+1",
      "x+2"
    ],
    "rule": "Trois valeurs consécutives",
    "comboBonus": {
      "kind": "companion",
      "type": "air",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/inward-heelflip/01-illustration.webp?v=ac857cd4cdd4",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/inward-heelflip/03-textes-symboles.webp?v=472b111e5939"
    }
  },
  {
    "id": 12,
    "key": "hardflip",
    "name": "Hardflip",
    "type": "kick",
    "tier": "advanced",
    "copies": 2,
    "points": 8,
    "difficultyPoints": 8,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.4179955418381344,
    "requirementCode": "exact36",
    "cost": 2,
    "pattern": "exact",
    "values": [
      3,
      6
    ],
    "symbols": [
      "3",
      "6"
    ],
    "rule": "Un 3 et un 6",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/hardflip/01-illustration.webp?v=8d56e305e4a8",
      "graphics": "assets/tricks/frames/advanced-2-plain.svg?v=453f304469b0",
      "information": "assets/tricks/hardflip/03-textes-symboles.webp?v=4c06951b0587"
    }
  },
  {
    "id": 13,
    "key": "360-flip",
    "name": "360 Flip",
    "type": "kick",
    "tier": "epic",
    "copies": 1,
    "points": 10,
    "difficultyPoints": 10,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.263224451303155,
    "requirementCode": "double4",
    "cost": 2,
    "pattern": "exact",
    "values": [
      4,
      4
    ],
    "symbols": [
      "4",
      "4"
    ],
    "rule": "Deux 4",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/360-flip/01-illustration.webp?v=c1765df7d67e",
      "graphics": "assets/tricks/frames/epic-2-plain.svg?v=d46e18e069c9",
      "information": "assets/tricks/360-flip/03-textes-symboles.webp?v=f0dccd6bad58"
    }
  },
  {
    "id": 14,
    "key": "laser-flip",
    "name": "Laser Flip",
    "type": "kick",
    "tier": "epic",
    "copies": 1,
    "points": 15,
    "difficultyPoints": 13,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.14780521262002744,
    "requirementCode": "exact446",
    "cost": 3,
    "pattern": "exact",
    "values": [
      4,
      4,
      6
    ],
    "symbols": [
      "4",
      "4",
      "6"
    ],
    "rule": "Deux 4 et un 6",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/laser-flip/01-illustration.webp?v=e5bb72263e80",
      "graphics": "assets/tricks/frames/epic-3-plain.svg?v=96945c2bb9ff",
      "information": "assets/tricks/laser-flip/03-textes-symboles.webp?v=7f005e4a7e2e"
    }
  },
  {
    "id": 15,
    "key": "impossible",
    "name": "Impossible",
    "type": "kick",
    "tier": "epic",
    "copies": 1,
    "points": 17,
    "difficultyPoints": 15,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.062285665294924554,
    "requirementCode": "exact666",
    "cost": 3,
    "pattern": "exact",
    "values": [
      6,
      6,
      6
    ],
    "symbols": [
      "6",
      "6",
      "6"
    ],
    "rule": "Trois 6",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/impossible/01-illustration.webp?v=ee13847a47c2",
      "graphics": "assets/tricks/frames/epic-3-plain.svg?v=96945c2bb9ff",
      "information": "assets/tricks/impossible/03-textes-symboles.webp?v=452c79059e99"
    }
  },
  {
    "id": 16,
    "key": "50-50-grind",
    "name": "50-50 Grind",
    "type": "slide",
    "tier": "base",
    "copies": 3,
    "points": 2,
    "difficultyPoints": 2,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9993355624142661,
    "requirementCode": "low5",
    "cost": 2,
    "pattern": "at-most",
    "threshold": 5,
    "symbols": [
      "≤5",
      "≤5"
    ],
    "rule": "Deux dés ≤ 5",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/50-50-grind/01-illustration.webp?v=c4cbe598393c",
      "graphics": "assets/tricks/frames/base-2-plain.svg?v=f8435afda254",
      "information": "assets/tricks/50-50-grind/03-textes-symboles.webp?v=f57107eff333"
    }
  },
  {
    "id": 17,
    "key": "boardslide",
    "name": "Boardslide",
    "type": "slide",
    "tier": "base",
    "copies": 2,
    "points": 2,
    "difficultyPoints": 2,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.96875,
    "requirementCode": "mixed",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        2
      ],
      [
        1,
        4
      ],
      [
        1,
        6
      ],
      [
        2,
        3
      ],
      [
        2,
        5
      ],
      [
        3,
        4
      ],
      [
        3,
        6
      ],
      [
        4,
        5
      ],
      [
        5,
        6
      ]
    ],
    "symbols": [
      "P",
      "I"
    ],
    "rule": "Un pair et un impair",
    "comboBonus": {
      "kind": "companion",
      "type": "slide",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/boardslide/01-illustration.webp?v=89b4cf25e26e",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/boardslide/03-textes-symboles.webp?v=b61013b27722"
    }
  },
  {
    "id": 18,
    "key": "lipslide",
    "name": "Lipslide",
    "type": "slide",
    "tier": "base",
    "copies": 2,
    "points": 3,
    "difficultyPoints": 3,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9402863511659808,
    "requirementCode": "straight2",
    "cost": 2,
    "pattern": "straight",
    "symbols": [
      "x",
      "x+1"
    ],
    "rule": "Deux valeurs consécutives",
    "comboBonus": {
      "kind": "reward",
      "type": "reroll"
    },
    "layers": {
      "illustration": "assets/tricks/lipslide/01-illustration.webp?v=299a356ff7b6",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/lipslide/03-textes-symboles.webp?v=648b5c42e471"
    }
  },
  {
    "id": 19,
    "key": "tailslide",
    "name": "Tailslide",
    "type": "slide",
    "tier": "base",
    "copies": 2,
    "points": 3,
    "difficultyPoints": 3,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9416152263374485,
    "requirementCode": "largeGap",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        4
      ],
      [
        1,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        5
      ],
      [
        2,
        6
      ],
      [
        3,
        6
      ]
    ],
    "symbols": [
      "A",
      "B"
    ],
    "rule": "Écart ≥ 3",
    "comboBonus": {
      "kind": "reward",
      "type": "freeze"
    },
    "layers": {
      "illustration": "assets/tricks/tailslide/01-illustration.webp?v=ebf04eac1d19",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/tailslide/03-textes-symboles.webp?v=f2b31060c329"
    }
  },
  {
    "id": 20,
    "key": "noseslide",
    "name": "Noseslide",
    "type": "slide",
    "tier": "base",
    "copies": 2,
    "points": 3,
    "difficultyPoints": 3,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9131730109739369,
    "requirementCode": "doubleLow",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        1
      ],
      [
        2,
        2
      ],
      [
        3,
        3
      ],
      [
        4,
        4
      ],
      [
        5,
        5
      ]
    ],
    "symbols": [
      "x",
      "x"
    ],
    "rule": "Une paire de 1 à 5",
    "comboBonus": {
      "kind": "companion",
      "type": "air",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/noseslide/01-illustration.webp?v=3c8c6ee57312",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/noseslide/03-textes-symboles.webp?v=59f77feb0fc3"
    }
  },
  {
    "id": 21,
    "key": "nosegrind",
    "name": "Nosegrind",
    "type": "slide",
    "tier": "base",
    "copies": 2,
    "points": 4,
    "difficultyPoints": 4,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.8823731138545954,
    "requirementCode": "gap2",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        3
      ],
      [
        2,
        4
      ],
      [
        3,
        5
      ],
      [
        4,
        6
      ]
    ],
    "symbols": [
      "x",
      "x+2"
    ],
    "rule": "Deux valeurs d’écart 2",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/nosegrind/01-illustration.webp?v=858881e06ee1",
      "graphics": "assets/tricks/frames/base-2-plain.svg?v=f8435afda254",
      "information": "assets/tricks/nosegrind/03-textes-symboles.webp?v=4263fb47719e"
    }
  },
  {
    "id": 22,
    "key": "5-0-grind",
    "name": "5-0 Grind",
    "type": "slide",
    "tier": "advanced",
    "copies": 2,
    "points": 5,
    "difficultyPoints": 5,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.8257887517146777,
    "requirementCode": "extremes",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        5
      ],
      [
        2,
        6
      ]
    ],
    "symbols": [
      "≤2",
      "≥5"
    ],
    "rule": "Un dé ≤ 2 et un dé ≥ 5",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/5-0-grind/01-illustration.webp?v=c02b032dc4e1",
      "graphics": "assets/tricks/frames/advanced-2-plain.svg?v=453f304469b0",
      "information": "assets/tricks/5-0-grind/03-textes-symboles.webp?v=4afbaaedc759"
    }
  },
  {
    "id": 23,
    "key": "crooked-grind",
    "name": "Crooked Grind",
    "type": "slide",
    "tier": "advanced",
    "copies": 2,
    "points": 5,
    "difficultyPoints": 5,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.7678755144032922,
    "requirementCode": "evenDistinct",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        2,
        4
      ],
      [
        2,
        6
      ],
      [
        4,
        6
      ]
    ],
    "symbols": [
      "P",
      "≠P"
    ],
    "rule": "Deux pairs différents",
    "comboBonus": {
      "kind": "companion",
      "type": "kick",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/crooked-grind/01-illustration.webp?v=78b4c5288bab",
      "graphics": "assets/tricks/frames/advanced-2-bonus.svg?v=444d14e6c4b2",
      "information": "assets/tricks/crooked-grind/03-textes-symboles.webp?v=6525c56810be"
    }
  },
  {
    "id": 24,
    "key": "feeble-grind",
    "name": "Feeble Grind",
    "type": "slide",
    "tier": "advanced",
    "copies": 2,
    "points": 8,
    "difficultyPoints": 6,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.7407407407407407,
    "requirementCode": "bands3",
    "cost": 3,
    "pattern": "choices",
    "choices": [
      [
        1,
        3,
        5
      ],
      [
        1,
        3,
        6
      ],
      [
        1,
        4,
        5
      ],
      [
        1,
        4,
        6
      ],
      [
        2,
        3,
        5
      ],
      [
        2,
        3,
        6
      ],
      [
        2,
        4,
        5
      ],
      [
        2,
        4,
        6
      ]
    ],
    "symbols": [
      "1–2",
      "3–4",
      "5–6"
    ],
    "rule": "Un dé de chaque tranche",
    "comboBonus": {
      "kind": "reward",
      "type": "reroll"
    },
    "layers": {
      "illustration": "assets/tricks/feeble-grind/01-illustration.webp?v=a42884878a97",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/feeble-grind/03-textes-symboles.webp?v=4e6e35e386ae"
    }
  },
  {
    "id": 25,
    "key": "smith-grind",
    "name": "Smith Grind",
    "type": "slide",
    "tier": "advanced",
    "copies": 2,
    "points": 8,
    "difficultyPoints": 6,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.65625,
    "requirementCode": "odd3",
    "cost": 3,
    "pattern": "choices",
    "choices": [
      [
        1,
        1,
        1
      ],
      [
        1,
        1,
        3
      ],
      [
        1,
        1,
        5
      ],
      [
        1,
        3,
        3
      ],
      [
        1,
        3,
        5
      ],
      [
        1,
        5,
        5
      ],
      [
        3,
        3,
        3
      ],
      [
        3,
        3,
        5
      ],
      [
        3,
        5,
        5
      ],
      [
        5,
        5,
        5
      ]
    ],
    "symbols": [
      "1·3·5",
      "1·3·5",
      "1·3·5"
    ],
    "rule": "Trois impairs · doublons permis",
    "comboBonus": {
      "kind": "companion",
      "type": "slide",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/smith-grind/01-illustration.webp?v=f83f9b661508",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/smith-grind/03-textes-symboles.webp?v=4d1dd21ea75c"
    }
  },
  {
    "id": 26,
    "key": "suski-grind",
    "name": "Suski Grind",
    "type": "slide",
    "tier": "advanced",
    "copies": 2,
    "points": 7,
    "difficultyPoints": 7,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.6488340192043895,
    "requirementCode": "low2",
    "cost": 2,
    "pattern": "at-most",
    "threshold": 2,
    "symbols": [
      "≤2",
      "≤2"
    ],
    "rule": "Deux dés ≤ 2",
    "comboBonus": {
      "kind": "reward",
      "type": "adjust"
    },
    "layers": {
      "illustration": "assets/tricks/suski-grind/01-illustration.webp?v=0ffd60a7f98e",
      "graphics": "assets/tricks/frames/advanced-2-bonus.svg?v=444d14e6c4b2",
      "information": "assets/tricks/suski-grind/03-textes-symboles.webp?v=1ef8e8f75c4e"
    }
  },
  {
    "id": 27,
    "key": "salad-grind",
    "name": "Salad Grind",
    "type": "slide",
    "tier": "advanced",
    "copies": 2,
    "points": 9,
    "difficultyPoints": 7,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.5941358024691358,
    "requirementCode": "straight3",
    "cost": 3,
    "pattern": "straight",
    "symbols": [
      "x",
      "x+1",
      "x+2"
    ],
    "rule": "Trois valeurs consécutives",
    "comboBonus": {
      "kind": "companion",
      "type": "air",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/salad-grind/01-illustration.webp?v=90adee3f01bc",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/salad-grind/03-textes-symboles.webp?v=836716b7a010"
    }
  },
  {
    "id": 28,
    "key": "overcrook",
    "name": "Overcrook",
    "type": "slide",
    "tier": "advanced",
    "copies": 2,
    "points": 8,
    "difficultyPoints": 8,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.4179955418381344,
    "requirementCode": "exact25",
    "cost": 2,
    "pattern": "exact",
    "values": [
      2,
      5
    ],
    "symbols": [
      "2",
      "5"
    ],
    "rule": "Un 2 et un 5",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/overcrook/01-illustration.webp?v=d1364f933c51",
      "graphics": "assets/tricks/frames/advanced-2-plain.svg?v=453f304469b0",
      "information": "assets/tricks/overcrook/03-textes-symboles.webp?v=cfb93040fee1"
    }
  },
  {
    "id": 29,
    "key": "bluntslide",
    "name": "Bluntslide",
    "type": "slide",
    "tier": "epic",
    "copies": 1,
    "points": 11,
    "difficultyPoints": 9,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.3196159122085048,
    "requirementCode": "high5three",
    "cost": 3,
    "pattern": "at-least",
    "threshold": 5,
    "symbols": [
      "≥5",
      "≥5",
      "≥5"
    ],
    "rule": "Trois dés ≥ 5",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/bluntslide/01-illustration.webp?v=165f5d5273a0",
      "graphics": "assets/tricks/frames/epic-3-plain.svg?v=96945c2bb9ff",
      "information": "assets/tricks/bluntslide/03-textes-symboles.webp?v=b1b606c0029a"
    }
  },
  {
    "id": 30,
    "key": "nosebluntslide",
    "name": "Nosebluntslide",
    "type": "slide",
    "tier": "epic",
    "copies": 1,
    "points": 15,
    "difficultyPoints": 13,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.14780521262002744,
    "requirementCode": "exact366",
    "cost": 3,
    "pattern": "exact",
    "values": [
      3,
      6,
      6
    ],
    "symbols": [
      "3",
      "6",
      "6"
    ],
    "rule": "Un 3 et deux 6",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/nosebluntslide/01-illustration.webp?v=68acc655c333",
      "graphics": "assets/tricks/frames/epic-3-plain.svg?v=96945c2bb9ff",
      "information": "assets/tricks/nosebluntslide/03-textes-symboles.webp?v=8dacdc62d98d"
    }
  },
  {
    "id": 31,
    "key": "hurricane",
    "name": "Hurricane",
    "type": "slide",
    "tier": "epic",
    "copies": 1,
    "points": 16,
    "difficultyPoints": 14,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.12602880658436214,
    "requirementCode": "exact2345",
    "cost": 4,
    "pattern": "exact",
    "values": [
      2,
      3,
      4,
      5
    ],
    "symbols": [
      "2",
      "3",
      "4",
      "5"
    ],
    "rule": "Un 2, un 3, un 4 et un 5",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/hurricane/01-illustration.webp?v=d8139c3f2c37",
      "graphics": "assets/tricks/frames/epic-4-plain.svg?v=c83dd597ee17",
      "information": "assets/tricks/hurricane/03-textes-symboles.webp?v=544f176e6533"
    }
  },
  {
    "id": 32,
    "key": "180",
    "name": "180°",
    "type": "air",
    "tier": "base",
    "copies": 3,
    "points": 2,
    "difficultyPoints": 2,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.9821673525377229,
    "requirementCode": "low4",
    "cost": 2,
    "pattern": "at-most",
    "threshold": 4,
    "symbols": [
      "≤4",
      "≤4"
    ],
    "rule": "Deux dés ≤ 4",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/180/01-illustration.webp?v=a837b736df06",
      "graphics": "assets/tricks/frames/base-2-plain.svg?v=f8435afda254",
      "information": "assets/tricks/180/03-textes-symboles.webp?v=02b23eccb2ad"
    }
  },
  {
    "id": 33,
    "key": "indy-grab",
    "name": "Indy Grab",
    "type": "air",
    "tier": "base",
    "copies": 3,
    "points": 2,
    "difficultyPoints": 2,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.96875,
    "requirementCode": "mixed",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        2
      ],
      [
        1,
        4
      ],
      [
        1,
        6
      ],
      [
        2,
        3
      ],
      [
        2,
        5
      ],
      [
        3,
        4
      ],
      [
        3,
        6
      ],
      [
        4,
        5
      ],
      [
        5,
        6
      ]
    ],
    "symbols": [
      "P",
      "I"
    ],
    "rule": "Un pair et un impair",
    "comboBonus": {
      "kind": "companion",
      "type": "air",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/indy-grab/01-illustration.webp?v=09446090a9a7",
      "graphics": "assets/tricks/frames/base-2-bonus.svg?v=c2fb603f9bca",
      "information": "assets/tricks/indy-grab/03-textes-symboles.webp?v=f47d61330e29"
    }
  },
  {
    "id": 34,
    "key": "360",
    "name": "360°",
    "type": "air",
    "tier": "base",
    "copies": 3,
    "points": 4,
    "difficultyPoints": 4,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.8913323045267489,
    "requirementCode": "gap3",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        4
      ],
      [
        2,
        5
      ],
      [
        3,
        6
      ]
    ],
    "symbols": [
      "x",
      "x+3"
    ],
    "rule": "Deux valeurs d’écart 3",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/360/01-illustration.webp?v=dd17a165e256",
      "graphics": "assets/tricks/frames/base-2-plain.svg?v=f8435afda254",
      "information": "assets/tricks/360/03-textes-symboles.webp?v=a4e738bcd4c4"
    }
  },
  {
    "id": 35,
    "key": "melon-grab",
    "name": "Melon Grab",
    "type": "air",
    "tier": "advanced",
    "copies": 3,
    "points": 5,
    "difficultyPoints": 5,
    "scorePremium": 0,
    "effortBonus": 0,
    "p6": 0.8257887517146777,
    "requirementCode": "extremes",
    "cost": 2,
    "pattern": "choices",
    "choices": [
      [
        1,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        5
      ],
      [
        2,
        6
      ]
    ],
    "symbols": [
      "≤2",
      "≥5"
    ],
    "rule": "Un dé ≤ 2 et un dé ≥ 5",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/melon-grab/01-illustration.webp?v=292cd6cfc9cf",
      "graphics": "assets/tricks/frames/advanced-2-plain.svg?v=453f304469b0",
      "information": "assets/tricks/melon-grab/03-textes-symboles.webp?v=bdbc904cd3a9"
    }
  },
  {
    "id": 36,
    "key": "stalefish",
    "name": "Stalefish",
    "type": "air",
    "tier": "advanced",
    "copies": 3,
    "points": 8,
    "difficultyPoints": 6,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.7407407407407407,
    "requirementCode": "bands3",
    "cost": 3,
    "pattern": "choices",
    "choices": [
      [
        1,
        3,
        5
      ],
      [
        1,
        3,
        6
      ],
      [
        1,
        4,
        5
      ],
      [
        1,
        4,
        6
      ],
      [
        2,
        3,
        5
      ],
      [
        2,
        3,
        6
      ],
      [
        2,
        4,
        5
      ],
      [
        2,
        4,
        6
      ]
    ],
    "symbols": [
      "1–2",
      "3–4",
      "5–6"
    ],
    "rule": "Un dé de chaque tranche",
    "comboBonus": {
      "kind": "reward",
      "type": "reroll"
    },
    "layers": {
      "illustration": "assets/tricks/stalefish/01-illustration.webp?v=18d1e2d00432",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/stalefish/03-textes-symboles.webp?v=6351004d41c9"
    }
  },
  {
    "id": 37,
    "key": "540",
    "name": "540°",
    "type": "air",
    "tier": "advanced",
    "copies": 3,
    "points": 9,
    "difficultyPoints": 7,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.5941358024691358,
    "requirementCode": "straight3",
    "cost": 3,
    "pattern": "straight",
    "symbols": [
      "x",
      "x+1",
      "x+2"
    ],
    "rule": "Trois valeurs consécutives",
    "comboBonus": {
      "kind": "companion",
      "type": "kick",
      "points": 1
    },
    "layers": {
      "illustration": "assets/tricks/540/01-illustration.webp?v=3b34ef010de2",
      "graphics": "assets/tricks/frames/advanced-3-bonus.svg?v=4fae24ce1fbb",
      "information": "assets/tricks/540/03-textes-symboles.webp?v=8c85f0e82f1c"
    }
  },
  {
    "id": 38,
    "key": "720",
    "name": "720°",
    "type": "air",
    "tier": "advanced",
    "copies": 3,
    "points": 10,
    "difficultyPoints": 8,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.470679012345679,
    "requirementCode": "parityRun3",
    "cost": 3,
    "pattern": "choices",
    "choices": [
      [
        1,
        3,
        5
      ],
      [
        2,
        4,
        6
      ]
    ],
    "symbols": [
      "1/2",
      "3/4",
      "5/6"
    ],
    "rule": "1·3·5 ou 2·4·6",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/720/01-illustration.webp?v=08353636f5c0",
      "graphics": "assets/tricks/frames/advanced-3-plain.svg?v=9b1769042b51",
      "information": "assets/tricks/720/03-textes-symboles.webp?v=0422d4fd2118"
    }
  },
  {
    "id": 39,
    "key": "900",
    "name": "900°",
    "type": "air",
    "tier": "epic",
    "copies": 2,
    "points": 16,
    "difficultyPoints": 14,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.12281378600823045,
    "requirementCode": "highPairs4",
    "cost": 4,
    "pattern": "choices",
    "choices": [
      [
        4,
        4,
        5,
        5
      ],
      [
        4,
        4,
        6,
        6
      ],
      [
        5,
        5,
        6,
        6
      ]
    ],
    "symbols": [
      "A",
      "A",
      "B",
      "B"
    ],
    "rule": "Deux paires distinctes · 4, 5 ou 6",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/900/01-illustration.webp?v=96ca1782c9be",
      "graphics": "assets/tricks/frames/epic-4-plain.svg?v=c83dd597ee17",
      "information": "assets/tricks/900/03-textes-symboles.webp?v=77cf67aa9d4d"
    }
  },
  {
    "id": 40,
    "key": "1080",
    "name": "1080°",
    "type": "air",
    "tier": "epic",
    "copies": 1,
    "points": 18,
    "difficultyPoints": 16,
    "scorePremium": 2,
    "effortBonus": 2,
    "p6": 0.0522119341563786,
    "requirementCode": "fourKind",
    "cost": 4,
    "pattern": "choices",
    "choices": [
      [
        1,
        1,
        1,
        1
      ],
      [
        2,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        3
      ],
      [
        4,
        4,
        4,
        4
      ],
      [
        5,
        5,
        5,
        5
      ],
      [
        6,
        6,
        6,
        6
      ]
    ],
    "symbols": [
      "x",
      "x",
      "x",
      "x"
    ],
    "rule": "Quatre dés identiques",
    "comboBonus": null,
    "layers": {
      "illustration": "assets/tricks/1080/01-illustration.webp?v=67a031a14446",
      "graphics": "assets/tricks/frames/epic-4-plain.svg?v=c83dd597ee17",
      "information": "assets/tricks/1080/03-textes-symboles.webp?v=3ed2feca6734"
    }
  }
];
