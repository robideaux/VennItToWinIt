game = {
    title: "A Numbers Game",
    groups: [
        {
            id: 1,
            label: "Primes"
        },
        {
            id: 2,
            label: "Solid Pool Balls"
        },
        {
            id: 3,
            label: "A Few"
        }
    ],
    phrases: [
        {
            phrase: "17",
            short: "", // use this to save space, if defined.
            groupIds: [1]
        },
        {
            phrase: "8",
            short: "",
            groupIds: [2]
        },
        {
            phrase: "2",
            short: "", // empty or missing altogether just uses the phrase
            groupIds: [3]
        },
        {
            phrase: "7",
            short: "",
            groupIds: [1,2]
        },
        {
            phrase: "4",
            short: "",
            groupIds: [2,3]
        },
        {
            phrase: "1",
            short: "",
            groupIds: [1,3]
        },
        {
            phrase: "3",
            short: "",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
