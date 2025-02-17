game = {
    title: "Example Game",
    groups: [
        {
            id: 1,
            label: "Things in Group A"
        },
        {
            id: 2,
            label: "Things in Group B"
        },
        {
            id: 3,
            label: "Things in Group C"
        }
    ],
    phrases: [
        {
            phrase: "This is only in Group A",
            short: "Group A", // use this to save space, if defined.
            groupIds: [1]
        },
        {
            phrase: "Only in Group B",
            short: "Group B",
            groupIds: [2]
        },
        {
            phrase: "Group C only",
            short: "", // empty or missing altogether just uses the phrase
            groupIds: [3]
        },
        {
            phrase: "In Groups A & B",
            short: "A & B",
            groupIds: [1,2]
        },
        {
            phrase: "In Groups B & C",
            short: "B & C",
            groupIds: [2,3]
        },
        {
            phrase: "Shared by Groups A & C",
            short: "A & C",
            groupIds: [1,3]
        },
        {
            phrase: "In All Groups",
            short: "A,B,C",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
