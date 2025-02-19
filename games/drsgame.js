game = {
    title: "Vinegar Rock Candy",
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
            short: "",
            groupIds: [1,2]
        },
        {
            phrase: "Dark Chocolate",
            short: "",
            groupIds: [2,3]
        },
        {
            phrase: "Cream",
            short: "",
            groupIds: [1,3]
        },
        {
            phrase: "Cranberries",
            short: "",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
