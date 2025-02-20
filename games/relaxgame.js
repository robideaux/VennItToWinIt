game = {
    title: "Just Relax",
    groups: [
        {
            id: 1,
            label: "Tending a Boo-Boo"
        },
        {
            id: 2,
            label: "Getting Mugged"
        },
        {
            id: 3,
            label: "Beatles Albums"
        }
    ],
    phrases: [
        {
            phrase: "Peroxide",
            short: "", // use this to save space, if defined.
            groupIds: [1]
        },
        {
            phrase: "Wallet",
            short: "",
            groupIds: [2]
        },
        {
            phrase: "Please Please Me",
            short: "", // empty or missing altogether just uses the phrase
            groupIds: [3]
        },
        {
            phrase: "Don't Move",
            short: "",
            groupIds: [1,2]
        },
        {
            phrase: "Revolver",
            short: "",
            groupIds: [2,3]
        },
        {
            phrase: "Let It Be",
            short: "",
            groupIds: [1,3]
        },
        {
            phrase: "Help!",
            short: "",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
