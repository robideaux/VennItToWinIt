game = {
    title: "DRSJr Game",
    groups: [
        {
            id: 1,
            label: "Bands"
        },
        {
            id: 2,
            label: "Bitter Things"
        },
        {
            id: 3,
            label: "Food"
        }
    ],
    phrases: [
        {
            phrase: "Queen",
            short: "", // use this to save space, if defined.
            groupIds: [1]
        },
        {
            phrase: "Your Ex",
            short: "",
            groupIds: [2]
        },
        {
            phrase: "Corn",
            short: "", // empty or missing altogether just uses the phrase
            groupIds: [3]
        },
        {
            phrase: "Poison",
            short: "1 & 2",
            groupIds: [1,2]
        },
        {
            phrase: "Dark Chocolate",
            short: "2 & 3",
            groupIds: [2,3]
        },
        {
            phrase: "Cream",
            short: "1 & 3",
            groupIds: [1,3]
        },
        {
            phrase: "Cranberries",
            short: "1,2,3",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
