export const gameData = {
  version: 2,
  board: {
    columns: [
      {
        id: "topic-food",
        title: "Food",
        x: 0,
        cells: [
          {
            id: "question-food-5",
            coordinate: { x: 0, y: 0 },
            value: 10,
            powerUp: { type: "MYSTERY_GIFT" },
            question: "What are the two main types of toro served?",
            answer: "Chutoro and otoro.",
          },
          {
            id: "question-food-10",
            coordinate: { x: 0, y: 1 },
            value: 20,
            question: "Name 10 types of cheese.",
            answer:
              "Cheddar, Mozzarella, Parmesan, Swiss, Gouda, Brie, Feta, Provolone, Monterey Jack, Blue cheese, Ricotta, Cottage cheese, Goat cheese, Pepper Jack, Havarti, Gruyere, Camembert, Mascarpone.",
          },
          {
            id: "question-food-15",
            coordinate: { x: 0, y: 2 },
            value: 30,
            question:
              "How many points does it take to reach Silver status at Haidilao?",
            answer: "2000.",
          },
          {
            id: "question-food-20",
            coordinate: { x: 0, y: 3 },
            value: 40,
            question:
              "Name 5 Popular Taiwanese Food Dishes (Not Taiwan exclusive, no drinks).",
            answer:
              "Lu rou fan\nPopcorn chicken\nDan bing\nStinky tofu\nBeef Noodle Soup\nSweet Potato Balls\nFan Tuan.",
          },
        ],
      },
      {
        id: "topic-basketball",
        title: "Basketball",
        x: 1,
        cells: [
          {
            id: "question-basketball-5",
            coordinate: { x: 1, y: 0 },
            value: 10,
            question: "Name 5 players who played in the NBA finals.",
            answer: "(Check Live)",
          },
          {
            id: "question-basketball-10",
            coordinate: { x: 1, y: 1 },
            value: 20,
            powerUp: { type: "DOUBLE_BALANCE_ON_CORRECT" },
            question:
              "What are the names of one player at each position from my top 15 ranking?",
            answer:
              "PG: Curry, Magic, Paul.\nSG: Jordan, Kobe, Wade\nSF: Lebron Durant Bird\nPF: Duncan, Garnett, Dirk\nC: Kareem, Hakeem, Shaq",
          },
          {
            id: "question-basketball-15",
            coordinate: { x: 1, y: 2 },
            value: 30,
            question:
              "What is the different reason for setting a down screen vs a back screen?",
            answer:
              "A down screen frees a player moving up toward the perimeter, while a back screen frees a player cutting toward the basket by screening their defender from behind.",
          },
          {
            id: "question-basketball-20",
            coordinate: { x: 1, y: 3 },
            value: 40,
            question:
              "Name 5 basic offensive actions or plays that can happen on a basketball court. (Not “shoot,” “pass,” or “dribble.”)",
            answer:
              "Pick-and-roll\nPick-and-pop\nSlot cut\nBackdoor cut\nPost-up\nDHO\nIso\nSlip screen\nCatch-and-shoot\nFlashing\nGive-and-go\nOff-ball screen",
          },
        ],
      },
      {
        id: "topic-reality-tv",
        title: "Reality TV",
        x: 2,
        cells: [
          {
            id: "question-reality-tv-5",
            coordinate: { x: 2, y: 0 },
            value: 10,
            question: "Which city was season 10 of Love Is Blind based in?",
            answer: "Ohio.",
          },
          {
            id: "question-reality-tv-10",
            coordinate: { x: 2, y: 1 },
            value: 20,
            question: "Which couple last won Love Island USA (Season 7)?",
            answer: "Amaya and Bryan.",
          },
          {
            id: "question-reality-tv-15",
            coordinate: { x: 2, y: 2 },
            value: 30,
            powerUp: { type: "BONUS_ON_CORRECT" },
            question:
              "Which couple was voted the Perfect Match in the latest season 4?",
            answer: "Sophie and Dave.",
          },
          {
            id: "question-reality-tv-20",
            coordinate: { x: 2, y: 3 },
            value: 40,
            question:
              "Which couple won the main prize at the end of Season 6 of Too Hot To Handle?",
            answer: "Bri and Demari.",
          },
        ],
      },
      {
        id: "topic-gaming",
        title: "Gaming",
        x: 3,
        cells: [
          {
            id: "question-gaming-5",
            coordinate: { x: 3, y: 0 },
            value: 10,
            question:
              "What is the name of Caitlyn's ultimate ability in League? Must be the full name.",
            answer: "Ace in the Hole.",
          },
          {
            id: "question-gaming-10",
            coordinate: { x: 3, y: 1 },
            value: 20,
            question:
              "How many times has Faker made it to the finals of Worlds?",
            answer: "8.",
          },
          {
            id: "question-gaming-15",
            coordinate: { x: 3, y: 2 },
            value: 30,
            question:
              "What is the in-game device/menu Nikki uses, similar to a phone?",
            answer: "Pear-Pal.",
          },
          {
            id: "question-gaming-20",
            coordinate: { x: 3, y: 3 },
            value: 40,
            powerUp: { type: "HALVE_BALANCE_ON_INCORRECT" },
            question:
              "In LAD, what is Caleb's relationship to the player character before he becomes a romanceable love interest?",
            answer: "He is the player character's childhood friend.",
          },
        ],
      },
      {
        id: "topic-pop-mart",
        title: "Pop Mart",
        x: 4,
        cells: [
          {
            id: "question-pop-mart-5",
            coordinate: { x: 4, y: 0 },
            value: 10,
            question: "What city is Pop Mart headquartered in?",
            answer: "Beijing.",
          },
          {
            id: "question-pop-mart-10",
            coordinate: { x: 4, y: 1 },
            value: 20,
            powerUp: { type: "DISABLE_SELLING_ON_INCORRECT" },
            question:
              "What is Pop Mart's vending-machine-style retail format commonly called?",
            answer: "Robo Shop.",
          },
          {
            id: "question-pop-mart-15",
            coordinate: { x: 4, y: 2 },
            value: 30,
            question:
              "I have a dreamy, soft fantasy style and often appear with Cloud Baby. Who am I?",
            answer: "DIMOO.",
          },
          {
            id: "question-pop-mart-20",
            coordinate: { x: 4, y: 3 },
            value: 40,
            question:
              "Are there more or less than 30.5 Pop Mart IP figures in this condo?",
            answer: "Let's count to find out.",
          },
        ],
      },
    ],
  },
  rewards: [
    { id: "reward-mahas-po-boy", name: "Maha's Po Boy", value: 80 },
    { id: "reward-molly-tea", name: "Molly Tea", value: 60 },
    { id: "reward-macs-pizza-slice", name: "Mac's Pizza Slice", value: 40 },
    { id: "reward-badialli-slice", name: "Badialli Slice", value: 40 },
    { id: "reward-fresca-slice", name: "Fresca Slice", value: 40 },
    { id: "reward-tokyo-toast", name: "Tokyo Toast", value: 60 },
    { id: "reward-favourites-oysters", name: "Favourites Oysters", value: 80 },
    { id: "reward-alfies", name: "Alfie's", value: 80 },
    {
      id: "reward-good-brother-skewers",
      name: "Good Brother Skewers (2 orders)",
      value: 60,
    },
    { id: "reward-chayan", name: "Chayan", value: 60 },
    { id: "reward-hey-tea", name: "Hey Tea", value: 60 },
    {
      id: "reward-la-la-pork-floss-bun",
      name: "La La Pork Floss Bun",
      value: 40,
    },
    {
      id: "reward-terroni-sud-forno-pasta",
      name: "Terroni Sud Forno Pasta",
      value: 90,
    },
    {
      id: "reward-bang-bang-ice-cream",
      name: "Bang Bang Ice Cream",
      value: 40,
    },
    { id: "reward-hello-nori-set", name: "Hello Nori Set", value: 90 },
    {
      id: "reward-butter-chicken-garlic-naan",
      name: "Butter Chicken + Garlic Naan",
      value: 70,
    },
    { id: "reward-daldongnae", name: "Daldongnae (2 Meat dishes)", value: 100 },
    { id: "reward-haidilao", name: "Haidilao ($40 value)", value: 100 },
    { id: "league-RP", name: "Riot Points ($20)", value: 70 },
    { id: "snacks-basket", name: "Snack Basket ($15)", value: 50 },
  ],
  rewardValueOptions: [30, 40, 50, 60, 70, 80, 90, 100],
};
